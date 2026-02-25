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
      
      this.applyFilters();
    },

    async loadProducts() {
      try {
        console.log('Загружаем товары компенсации реактивной мощности...');
        const response = await fetch('../data/products.json');
        if (!response.ok) throw new Error('Failed to load products');
        
        const data = await response.json();
        console.log('Всего товаров в базе:', data.products.length);
        
        // Фильтруем только товары компенсации реактивной мощности
        this.products = data.products.filter(product => 
          product.commutation_type === 'reactive_power'
        );
        
        console.log('Товаров компенсации реактивной мощности найдено:', this.products.length);
        
        // Получаем уникальные бренды
        this.uniqueBrands = [...new Set(this.products.map(p => p.brand))].sort();
        console.log('Уникальные бренды:', this.uniqueBrands);
        
        // Получаем уникальные мощности (только для регулируемых)
        const regulatedProducts = this.products.filter(p => p.regulation_type === 'regulated');
        this.uniquePowers = [...new Set(regulatedProducts.map(p => p.power).filter(p => p))].sort((a, b) => a - b);
        console.log('Уникальные мощности:', this.uniquePowers);
        
        // Получаем уникальные количества ступеней (только для регулируемых)
        this.uniqueSteps = [...new Set(regulatedProducts.map(p => p.step).filter(s => s))].sort((a, b) => a - b);
        console.log('Уникальные ступени:', this.uniqueSteps);
        
        this.loading = false;
      } catch (error) {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    },

    filterByType(type) {
      console.log('Фильтруем по типу:', type);
      this.selectedType = type;
      this.selectedBrand = null;
      this.selectedPower = null;
      this.selectedStep = null;
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
      console.log('Применяем фильтры. Всего товаров:', filtered.length);
      console.log('Выбранный тип:', this.selectedType);
      console.log('Выбранный бренд:', this.selectedBrand);
      console.log('Выбранная мощность:', this.selectedPower);
      console.log('Выбранное количество ступеней:', this.selectedStep);

      // Фильтр по типу установки
      if (this.selectedType) {
        filtered = filtered.filter(product => 
          product.regulation_type === this.selectedType
        );
        console.log('После фильтра по типу:', filtered.length);
      }

      // Фильтр по бренду
      if (this.selectedBrand) {
        filtered = filtered.filter(product => product.brand === this.selectedBrand);
        console.log('После фильтра по бренду:', filtered.length);
      }

      // Фильтр по мощности
      if (this.selectedPower) {
        filtered = filtered.filter(product => product.power === this.selectedPower);
        console.log('После фильтра по мощности:', filtered.length);
      }

      // Фильтр по количеству ступеней
      if (this.selectedStep) {
        filtered = filtered.filter(product => product.step === this.selectedStep);
        console.log('После фильтра по ступеням:', filtered.length);
      }

      // Сортировка
      if (this.sortBy === 'price_asc') {
        filtered.sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
      } else if (this.sortBy === 'price_desc') {
        filtered.sort((a, b) => (b.base_price || 0) - (a.base_price || 0));
      }

      this.filteredProducts = filtered;
      console.log('Итоговое количество товаров:', this.filteredProducts.length);
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