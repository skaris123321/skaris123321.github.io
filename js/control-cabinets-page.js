function controlCabinetsCatalog() {
  return {
    products: [],
    filteredProducts: [],
    loading: true,
    selectedControlType: null, // 'soft_start', 'frequency_converter', 'direct_start'
    selectedBrand: null,
    sortBy: 'price_asc',
    uniqueBrands: [],
    currentPage: 1,
    itemsPerPage: 8,

    async init() {
      await this.loadProducts();
      this.applyUrlFilters(); // Применяем фильтры из URL
      this.applyFilters();
    },

    applyUrlFilters() {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Читаем параметры из URL
      const brand = urlParams.get('brand');
      const controlType = urlParams.get('controlType');
      
      // Применяем фильтры
      if (brand) {
        this.selectedBrand = brand;
      }
      
      if (controlType) {
        this.selectedControlType = controlType;
      }
    },

    async loadProducts() {
      try {
        console.log('Загружаем товары...');
        const api = new ProductsAPI();
        const data = await api.loadProducts();
        
        if (!data || !data.products) {
          throw new Error('Failed to load products');
        }
        
        console.log('Всего товаров в базе:', data.products.length);
        
        // Фильтруем только шкафы управления
        this.products = data.products.filter(product => 
          product.commutation_type === 'control_cabinet'
        );
        
        console.log('Шкафов управления найдено:', this.products.length);
        
        // Проверяем типы управления
        const controlTypes = [...new Set(this.products.map(p => p.control_type))];
        console.log('Типы управления:', controlTypes);
        
        // Проверяем количество товаров по типам
        const frequencyConverters = this.products.filter(p => p.control_type === 'frequency_converter');
        console.log('Преобразователей частоты:', frequencyConverters.length);
        
        // Получаем уникальные бренды
        this.uniqueBrands = [...new Set(this.products.map(p => p.brand))].sort();
        console.log('Уникальные бренды:', this.uniqueBrands);
        
        this.loading = false;
      } catch (error) {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    },

    filterByControlType(controlType) {
      console.log('Фильтруем по типу управления:', controlType);
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
      console.log('Применяем фильтры. Всего товаров:', filtered.length);
      console.log('Выбранный тип управления:', this.selectedControlType);
      console.log('Выбранный бренд:', this.selectedBrand);

      // Фильтр по типу управления
      if (this.selectedControlType) {
        filtered = filtered.filter(product => 
          product.control_type === this.selectedControlType
        );
        console.log('После фильтра по типу управления:', filtered.length);
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
      }

      this.filteredProducts = filtered;
      this.currentPage = 1;
      console.log('Итоговое количество товаров после фильтрации:', this.filteredProducts.length);
    },

    get totalPages() {
      return Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    },

    get paginatedProducts() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredProducts.slice(start, start + this.itemsPerPage);
    },

    get pageNumbers() {
      const pages = [];
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
      return pages;
    },

    formatPrice(price) {
      if (!price) return 'Цена по запросу';
      return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    },

    getProductUrl(product) {
      // Для шкафов управления передаем параметры вместо ID
      if (product.commutation_type === 'control_cabinet') {
        const params = new URLSearchParams({
          commutationType: product.commutation_type,
          motorPower: product.motor_power,
          controlType: product.control_type,
          manufacturerBrand: product.brand
        });
        
        // Для прямого пуска добавляем дополнительные параметры
        if (product.control_type === 'direct_start') {
          params.append('startType', product.start_type || 'direct_start');
          params.append('pumpCount', product.pump_count || '1');
        }
        
        return `product.html?${params.toString()}`;
      }
      // Для остальных товаров используем ID
      return `product.html?id=${product.id}`;
    }
  };
}