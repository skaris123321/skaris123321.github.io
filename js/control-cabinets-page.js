function controlCabinetsCatalog() {
  return {
    products: [],
    filteredProducts: [],
    loading: true,
    selectedControlType: null, // 'soft_start', 'frequency_converter', 'direct_start'
    selectedBrand: null,
    sortBy: 'price_asc',
    uniqueBrands: [],

    async init() {
      await this.loadProducts();
      this.applyFilters();
    },

    async loadProducts() {
      try {
        const response = await fetch('../data/products.json');
        if (!response.ok) throw new Error('Failed to load products');
        
        const data = await response.json();
        
        // Фильтруем только шкафы управления
        this.products = data.products.filter(product => 
          product.commutation_type === 'control_cabinet'
        );
        
        // Получаем уникальные бренды
        this.uniqueBrands = [...new Set(this.products.map(p => p.brand))].sort();
        
        this.loading = false;
      } catch (error) {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    },

    filterByControlType(controlType) {
      this.selectedControlType = controlType;
      this.selectedBrand = null; // Сбрасываем фильтр по бренду
      this.applyFilters();
    },

    filterByBrand(brand) {
      if (this.selectedBrand === brand) {
        this.selectedBrand = null; // Убираем фильтр если кликнули на уже выбранный
      } else {
        this.selectedBrand = brand;
      }
      this.applyFilters();
    },

    applyFilters() {
      let filtered = [...this.products];

      // Фильтр по типу управления
      if (this.selectedControlType) {
        filtered = filtered.filter(product => 
          product.control_type === this.selectedControlType
        );
      }

      // Фильтр по бренду
      if (this.selectedBrand) {
        filtered = filtered.filter(product => product.brand === this.selectedBrand);
      }

      // Сортировка
      if (this.sortBy === 'price_asc') {
        filtered.sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
      } else if (this.sortBy === 'price_desc') {
        filtered.sort((a, b) => (b.base_price || 0) - (a.base_price || 0));
      } else if (this.sortBy === 'power_asc') {
        filtered.sort((a, b) => (a.motor_power || 0) - (b.motor_power || 0));
      } else if (this.sortBy === 'power_desc') {
        filtered.sort((a, b) => (b.motor_power || 0) - (a.motor_power || 0));
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