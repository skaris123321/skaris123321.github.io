function reactivePowerCatalog() {
  return {
    products: [],
    filteredProducts: [],
    loading: true,
    selectedType: null, // 'unregulated' или 'regulated'
    selectedBrand: null,
    selectedPower: null,
    sortBy: 'price_asc',
    uniqueBrands: [],
    availablePowers: [],

    async init() {
      await this.loadProducts();
      // Читаем параметр regulationType из URL
      const urlParams = new URLSearchParams(window.location.search);
      const regulationType = urlParams.get('regulationType');
      if (regulationType) {
        this.selectedType = regulationType;
        this.updateAvailablePowers();
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
        
        // Получаем доступные мощности
        this.updateAvailablePowers();
        
        this.loading = false;
      } catch (error) {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    },

    updateAvailablePowers() {
      // Все возможные мощности
      const allPowers = [10, 15, 25, 40, 50, 75, 80, 90, 100, 125, 140, 150, 175, 180, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500, 525, 550, 575, 600];
      
      // Фильтруем товары по выбранному типу
      let filtered = this.products;
      if (this.selectedType) {
        filtered = filtered.filter(p => p.regulation_type === this.selectedType);
      }
      
      // Получаем мощности, доступные для выбранного типа
      const availablePowersSet = new Set(filtered.map(p => p.power));
      
      // Создаем массив объектов с информацией о доступности
      this.availablePowers = allPowers.map(power => ({
        value: power,
        available: availablePowersSet.has(power)
      }));
    },

    filterByType(type) {
      console.log('Фильтруем по типу:', type);
      this.selectedType = type;
      this.selectedBrand = null;
      this.selectedPower = null;
      this.updateAvailablePowers();
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

    applyFilters() {
      let filtered = [...this.products];
      console.log('Применяем фильтры. Всего товаров:', filtered.length);
      console.log('Выбранный тип:', this.selectedType);
      console.log('Выбранный бренд:', this.selectedBrand);
      console.log('Выбранная мощность:', this.selectedPower);

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
      // Передаем все параметры товара для автоматического выбора на странице product.html
      const params = new URLSearchParams({
        brand: product.brand,
        commutation_type: product.commutation_type,
        regulation_type: product.regulation_type,
        power: product.power
      });
      
      // Добавляем step если есть
      if (product.step) {
        params.append('step', product.step);
      }
      
      return `product.html?${params.toString()}`;
    }
  };
}