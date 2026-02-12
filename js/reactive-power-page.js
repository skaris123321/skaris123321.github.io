// JavaScript для страницы Компенсация реактивной мощности
if (typeof window.solveSimpleChallenge === 'undefined') {
  window.solveSimpleChallenge = () => null;
}

document.addEventListener('alpine:init', () => {
  console.log('Каталог компенсации реактивной мощности запущен');
  
  Alpine.data('reactivePowerCatalog', () => {
    return {
      products: [],
      filteredProducts: [],
      selectedBrand: null,
      selectedPower: null,
      selectedRegulationType: null,
      sortBy: 'price_asc',
      loading: true,
      searchQuery: '',
      
      async init() {
        await this.loadProducts();
        this.applyUrlFilters();
        this.checkUrlParams();
        this.filteredProducts = [...this.products];
        this.applyFilters();
      },
      
      applyUrlFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        const regulationType = urlParams.get('regulationType');
        const power = urlParams.get('power');
        
        if (regulationType) {
          this.selectedRegulationType = regulationType;
        }
        
        if (power) {
          this.selectedPower = parseInt(power);
        }
      },
      
      checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        if (searchQuery) {
          this.searchQuery = searchQuery;
          const searchInput = document.querySelector('.search-input');
          if (searchInput) {
            searchInput.value = searchQuery;
          }
        }
      },
      
      async loadProducts() {
        try {
          const response = await fetch('../data/products.json');
          const data = await response.json();
          
          if (data && Array.isArray(data.products)) {
            this.products = data.products.filter(p => 
              p.commutation_type === 'capacitor_unit'
            );
            console.log(`Загружено ${this.products.length} товаров компенсации реактивной мощности`);
          }
        } catch (error) {
          console.error('Ошибка загрузки товаров:', error);
        } finally {
          this.loading = false;
        }
      },
      
      filterByBrand(brand) {
        this.selectedBrand = this.selectedBrand === brand ? null : brand;
        this.applyFilters();
      },
      
      filterByPower(power) {
        this.selectedPower = this.selectedPower === power ? null : power;
        this.applyFilters();
      },
      
      filterByRegulationType(type) {
        if (this.selectedRegulationType === type) {
          this.selectedRegulationType = null;
        } else {
          this.selectedRegulationType = type;
        }
        this.applyFilters();
      },
      
      applyFilters() {
        let filtered = [...this.products];
        
        if (this.selectedBrand) {
          filtered = filtered.filter(p => p.brand === this.selectedBrand);
        }
        
        if (this.selectedPower) {
          filtered = filtered.filter(p => p.power === this.selectedPower);
        }
        
        if (this.selectedRegulationType) {
          filtered = filtered.filter(p => p.regulation_type === this.selectedRegulationType);
        }
        
        filtered.sort((a, b) => {
          switch (this.sortBy) {
            case 'price_asc':
              return a.base_price - b.base_price;
            case 'price_desc':
              return b.base_price - a.base_price;
            case 'article_asc':
              return (a.article || '').localeCompare(b.article || '');
            case 'article_desc':
              return (b.article || '').localeCompare(a.article || '');
            default:
              if (a.power !== b.power) {
                return a.power - b.power;
              }
              return (a.brand || '').localeCompare(b.brand || '');
          }
        });
        
        this.filteredProducts = filtered;
      },
      
      getProductUrl(product) {
        return `product.html?id=${product.id}`;
      },
      
      formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
      },
      
      get uniqueBrands() {
        if (!this.products || this.products.length === 0) {
          return [];
        }
        const brands = [...new Set(this.products.map(p => p.brand).filter(Boolean))];
        return brands.sort();
      },
      
      get uniquePowers() {
        if (!this.products || this.products.length === 0) {
          return [];
        }
        const powers = [...new Set(this.products.map(p => p.power).filter(Boolean))];
        return powers.sort((a, b) => a - b);
      },
      
      getSelectedSubcategory() {
        if (this.selectedRegulationType === 'unregulated') {
          return 'Нерегулируемые конденсаторные установки';
        } else if (this.selectedRegulationType === 'regulated') {
          return 'Автоматически регулируемые конденсаторные установки';
        }
        return null;
      }
    };
  });
});
