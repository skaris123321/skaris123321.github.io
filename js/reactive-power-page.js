function reactivePowerCatalog() {
  return {
    products: [],
    filteredProducts: [],
    loading: true,
    selectedType: null, // 'unregulated' или 'regulated'
    selectedBrand: null,
    selectedPower: null,
    selectedStep: null,
    sortBy: 'price_asc',
    uniqueBrands: [],
    uniquePowers: [],
    uniqueSteps: [],
    availablePowers: [],

    async init() {
      await this.loadProducts();
      // Читаем параметры из URL
      const urlParams = new URLSearchParams(window.location.search);
      const brand = urlParams.get('brand');
      const regulationType = urlParams.get('regulationType');
      
      if (brand) {
        this.selectedBrand = brand;
      }
      if (regulationType) {
        this.selectedType = regulationType;
      }
      
      this.updateAvailableFilters();
      this.applyFilters();
    },

    async loadProducts() {
      try {
        const response = await fetch('../data/products.json');
        if (!response.ok) throw new Error('Failed to load products');
        
        const data = await response.json();
        // Фильтруем только товары компенсации реактивной мощности
        this.products = data.products.filter(product => 
          product.commutation_type === 'reactive_power'
        );
        
        // Получаем уникальные бренды
        this.uniqueBrands = [...new Set(this.products.map(p => p.brand))].sort();
        // Получаем все уникальные мощности
        this.uniquePowers = [...new Set(this.products.map(p => p.power).filter(p => p))].sort((a, b) => a - b);
        // Получаем уникальные количества ступеней (только для регулируемых)
        const regulatedProducts = this.products.filter(p => p.regulation_type === 'regulated');
        this.uniqueSteps = [...new Set(regulatedProducts.map(p => p.step).filter(s => s))].sort((a, b) => a - b);
        this.loading = false;
      } catch (error) {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    },

    updateAvailableFilters() {
      // Обновляем доступные мощности в зависимости от выбранного типа
      let productsForFilters = this.products;
      
      if (this.selectedType) {
        productsForFilters = productsForFilters.filter(p => p.regulation_type === this.selectedType);
      }
      
      this.availablePowers = [...new Set(productsForFilters.map(p => p.power).filter(p => p))].sort((a, b) => a - b);
    },

    filterByType(type) {
      this.selectedType = type;
      this.selectedBrand = null;
      this.selectedPower = null;
      this.selectedStep = null;
      this.updateAvailableFilters();
      this.applyFilters();
    },

    filterByBrand(brand) {
      if (this.selectedBrand === brand) {
        this.selectedBrand = null;
      } else {
        this.selectedBrand = brand;
      }
      this.applyFilters();
    },

    filterByPower(power) {
      if (this.selectedPower === power) {
        this.selectedPower = null;
      } else {
        this.selectedPower = power;
      }
      this.applyFilters();
    },

    filterByStep(step) {
      if (this.selectedStep === step) {
        this.selectedStep = null;
      } else {
        this.selectedStep = step;
      }
      this.applyFilters();
    },

    applyFilters() {
      let filtered = [...this.products];
      // Фильтр по типу установки
      if (this.selectedType) {
        filtered = filtered.filter(product => 
          product.regulation_type === this.selectedType
        );
        }

      // Фильтр по бренду
      if (this.selectedBrand) {
        filtered = filtered.filter(product => product.brand === this.selectedBrand);
        }

      // Фильтр по мощности
      if (this.selectedPower) {
        filtered = filtered.filter(product => product.power === this.selectedPower);
        }

      // Фильтр по количеству ступеней
      if (this.selectedStep) {
        filtered = filtered.filter(product => product.step === this.selectedStep);
        }

      // Сортировка
      if (this.sortBy === 'price_asc') {
        filtered.sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
      } else if (this.sortBy === 'price_desc') {
        filtered.sort((a, b) => (b.base_price || 0) - (a.base_price || 0));
      }

      this.filteredProducts = filtered;
      },

    formatPrice(price) {
      if (!price) return 'Цена по запросу';
      return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    },

    getProductUrl(product) {
      return `product.html?id=${product.id}`;
    }
  };
}