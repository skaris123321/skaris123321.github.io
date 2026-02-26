function motorControlBoxesCatalog() {
  return {
    products: [],
    filteredProducts: [],
    loading: true,
    selectedBoxType: null, // 'single_feeder', 'double_feeder', 'triple_feeder'
    selectedBrand: null,
    selectedReversible: null, // true/false для двухфидерных
    sortBy: 'price_asc',
    uniqueBrands: [],

    async init() {
      await this.loadProducts();
      this.applyUrlFilters();
      this.applyFilters();
    },

    applyUrlFilters() {
      const urlParams = new URLSearchParams(window.location.search);
      
      const brand = urlParams.get('brand');
      const boxType = urlParams.get('boxType');
      const reversible = urlParams.get('reversible');
      
      if (brand) {
        this.selectedBrand = brand;
      }
      
      if (boxType) {
        this.selectedBoxType = boxType;
      }
      
      if (reversible !== null) {
        this.selectedReversible = reversible === 'true';
      }
    },

    async loadProducts() {
      try {
        console.log('Загружаем ящики управления...');
        
        // Загружаем только категорию motor-control-boxes для оптимизации
        const api = new ProductsAPI();
        const data = await api.loadCategory('motor-control-boxes');
        
        this.products = data.products || [];
        
        console.log('Ящиков управления найдено:', this.products.length);
        
        // Получаем уникальные бренды
        this.uniqueBrands = [...new Set(this.products.map(p => p.brand))].sort();
        console.log('Уникальные бренды:', this.uniqueBrands);
        
        this.loading = false;
      } catch (error) {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    },

    filterByBoxType(boxType) {
      console.log('Фильтруем по типу ящика:', boxType);
      
      if (this.selectedBoxType === boxType) {
        // Если уже выбран этот тип, убираем фильтр
        this.selectedBoxType = null;
        this.selectedReversible = null;
      } else {
        this.selectedBoxType = boxType;
        // Сбрасываем фильтр реверсивности при смене типа
        if (boxType !== 'double_feeder') {
          this.selectedReversible = null;
        }
      }
      
      this.selectedBrand = null; // Сбрасываем фильтр по бренду
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

    filterByReversible(reversible) {
      if (this.selectedReversible === reversible) {
        this.selectedReversible = null;
      } else {
        this.selectedReversible = reversible;
      }
      this.applyFilters();
    },

    applyFilters() {
      let filtered = [...this.products];
      console.log('Применяем фильтры. Всего товаров:', filtered.length);
      console.log('Выбранный тип ящика:', this.selectedBoxType);
      console.log('Выбранный бренд:', this.selectedBrand);
      console.log('Выбрана реверсивность:', this.selectedReversible);

      // Фильтр по типу ящика
      if (this.selectedBoxType) {
        filtered = filtered.filter(product => 
          product.box_type === this.selectedBoxType
        );
        console.log('После фильтра по типу ящика:', filtered.length);
      }

      // Фильтр по реверсивности (только для двухфидерных)
      if (this.selectedReversible !== null && this.selectedBoxType === 'double_feeder') {
        filtered = filtered.filter(product => 
          product.reversible === this.selectedReversible
        );
        console.log('После фильтра по реверсивности:', filtered.length);
      }

      // Фильтр по бренду
      if (this.selectedBrand) {
        filtered = filtered.filter(product => product.brand === this.selectedBrand);
        console.log('После фильтра по бренду:', filtered.length);
      }

      // Сортировка
      if (this.sortBy === 'price_asc') {
        filtered.sort((a, b) => (a.base_price || 0) - (b.base_price || 0));
      } else if (this.sortBy === 'price_desc') {
        filtered.sort((a, b) => (b.base_price || 0) - (a.base_price || 0));
      } else {
        // По умолчанию сортируем по номинальному току
        filtered.sort((a, b) => (a.nominal_current || 0) - (b.nominal_current || 0));
      }

      this.filteredProducts = filtered;
      console.log('Итоговое количество товаров после фильтрации:', this.filteredProducts.length);
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
