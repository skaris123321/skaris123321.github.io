document.addEventListener('alpine:init', () => {
  Alpine.data('motorControlBoxesCatalog', () => ({
    products: [],
    filteredProducts: [],
    loading: true,
    selectedBoxType: null, // 'single_feeder', 'double_feeder', 'triple_feeder'
    selectedBrand: null,
    selectedReversible: null, // true, false, null
    sortBy: 'price_asc',
    uniqueBrands: [],
    currentPage: 1,
    itemsPerPage: 8,

    async init() {
      await this.loadProducts();
      this.applyUrlFilters();
      this.applyFilters();
    },

    applyUrlFilters() {
      const urlParams = new URLSearchParams(window.location.search);
      
      const brand = urlParams.get('brand');
      const boxType = urlParams.get('boxType');
      
      if (brand) {
        this.selectedBrand = brand;
      }
      
      if (boxType) {
        this.selectedBoxType = boxType;
      }
    },

    async loadProducts() {
      try {
        const api = new ProductsAPI();
        const data = await api.loadCategory('motor-control-boxes');
        
        this.products = data.products || [];
        
        // Получаем уникальные бренды (только IEK, TDM, EKF)
        const allowedBrands = ['IEK', 'TDM', 'EKF'];
        this.uniqueBrands = [...new Set(this.products.map(p => p.brand))]
          .filter(brand => allowedBrands.includes(brand))
          .sort();
        
        this.loading = false;
      } catch (error) {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    },

    filterByBoxType(boxType) {
      if (this.selectedBoxType === boxType) {
        this.selectedBoxType = null;
      } else {
        this.selectedBoxType = boxType;
      }
      
      this.selectedBrand = null;
      this.selectedReversible = null;
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

      // Фильтр по типу ящика
      if (this.selectedBoxType) {
        filtered = filtered.filter(product => 
          product.box_type === this.selectedBoxType
        );
      }

      // Фильтр по бренду
      if (this.selectedBrand) {
        filtered = filtered.filter(product => product.brand === this.selectedBrand);
      }

      // Фильтр по типу регулирования
      if (this.selectedReversible !== null) {
        filtered = filtered.filter(product => product.reversible === this.selectedReversible);
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
      this.currentPage = 1;
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
      return `product.html?id=${product.id}`;
    }
  }));
});
