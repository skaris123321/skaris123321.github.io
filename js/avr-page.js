// JavaScript для страницы каталога АВР
if (typeof window.solveSimpleChallenge === 'undefined') {
  window.solveSimpleChallenge = () => null;
}

document.addEventListener('alpine:init', () => {
  console.log('АВР каталог запущен');
  
  Alpine.data('avrCatalog', () => {
    return {
      products: [],
      filteredProducts: [],
      selectedBrand: null,
      selectedInputs: null,
      sortBy: 'price_asc',
      loading: true,
      searchQuery: '',
      
      async init() {
        await this.loadProducts();
        this.checkUrlParams();
        // Автоматически выбираем первый бренд при загрузке
        if (this.uniqueBrands.length > 0 && !this.selectedBrand) {
          this.selectedBrand = this.uniqueBrands[0];
        }
        this.applyFilters();
      },
      
      checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        if (searchQuery) {
          this.searchQuery = searchQuery;
          // Обновляем поле поиска в хедере
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
            this.products = data.products;
            console.log(`Загружено ${this.products.length} товаров`);
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
      
      filterByInputs(inputs) {
        this.selectedInputs = this.selectedInputs === inputs ? null : inputs;
        this.applyFilters();
      },
      
      applyFilters() {
        let filtered = [...this.products];
        
        // Фильтр по бренду
        if (this.selectedBrand) {
          filtered = filtered.filter(p => p.brand === this.selectedBrand);
        }
        
        // Фильтр по количеству вводов
        if (this.selectedInputs) {
          filtered = filtered.filter(p => p.inputs_count === this.selectedInputs);
        }
        
        // Сортировка
        filtered.sort((a, b) => {
          switch (this.sortBy) {
            case 'price_asc':
              // Сначала по номинальному току, потом по цене
              if (a.nominal_current !== b.nominal_current) {
                return a.nominal_current - b.nominal_current;
              }
              return a.base_price - b.base_price;
            case 'price_desc':
              // Сначала по номинальному току, потом по цене убывание
              if (a.nominal_current !== b.nominal_current) {
                return a.nominal_current - b.nominal_current;
              }
              return b.base_price - a.base_price;
            case 'article_asc':
              return (a.article || '').localeCompare(b.article || '');
            case 'article_desc':
              return (b.article || '').localeCompare(a.article || '');
            default:
              // По умолчанию сортируем по номинальному току, потом по количеству вводов
              if (a.nominal_current !== b.nominal_current) {
                return a.nominal_current - b.nominal_current;
              }
              return a.inputs_count.localeCompare(b.inputs_count);
          }
        });
        
        this.filteredProducts = filtered;
      },
      
      getProductUrl(product) {
        const params = new URLSearchParams({
          brand: product.brand,
          commutation_type: product.commutation_type,
          nominal_current: product.nominal_current,
          inputs_count: product.inputs_count
        });
        return `product.html?${params.toString()}`;
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
      }
    };
  });
});
