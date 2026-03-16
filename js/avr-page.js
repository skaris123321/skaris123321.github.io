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
      selectedCommutationType: null,
      selectedPolesCount: null,
      sortBy: 'price_asc',
      loading: true,
      searchQuery: '',
      currentPage: 1,
      itemsPerPage: 16,
      
      async init() {
        await this.loadProducts();
        this.applyUrlFilters(); // Применяем фильтры из URL
        this.checkUrlParams();
        // Изначально показываем все товары
        this.filteredProducts = [...this.products];
        this.applyFilters();
      },
      
      applyUrlFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Читаем параметры из URL
        const brand = urlParams.get('brand');
        const commutationType = urlParams.get('commutationType');
        const inputs = urlParams.get('inputs');
        const poles = urlParams.get('poles');
        const current = urlParams.get('current');
        
        // Применяем фильтры
        if (brand) {
          this.selectedBrand = brand;
        }
        
        if (commutationType) {
          this.selectedCommutationType = commutationType;
        }
        
        if (inputs) {
          this.selectedInputs = inputs;
        }
        
        if (poles) {
          this.selectedPolesCount = poles;
        }
        
        if (current) {
          // Ток будет применен в applyFilters()
          this.selectedCurrent = current;
        }
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
          const api = new ProductsAPI();
          const data = await api.loadProducts();
          
          if (data && Array.isArray(data.products)) {
            // Фильтруем только АВР (моноблочные и контакторы), исключаем шкафы управления
            this.products = data.products.filter(p => 
              p.commutation_type === 'monoblock' || p.commutation_type === 'contactors'
            );
            console.log(`Загружено ${this.products.length} товаров АВР`);
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
      
      filterByPolesCount(polesCount) {
        this.selectedPolesCount = this.selectedPolesCount === polesCount ? null : polesCount;
        this.applyFilters();
      },
      
      filterByInputs(inputs) {
        // Если уже выбраны такие же вводы, убираем фильтр
        if (this.selectedInputs === inputs && this.selectedCommutationType === 'monoblock') {
          this.selectedInputs = null;
          this.selectedCommutationType = null;
        } else {
          // Иначе устанавливаем фильтр на моноблочные АВР с нужным количеством вводов
          this.selectedInputs = inputs;
          this.selectedCommutationType = 'monoblock';
        }
        this.applyFilters();
      },
      
      filterByCommutationType(type) {
        // Если уже выбран такой же тип коммутации, убираем фильтр
        if (this.selectedCommutationType === type) {
          this.selectedCommutationType = null;
          this.selectedInputs = null;
          this.selectedPolesCount = null;
        } else {
          // Устанавливаем фильтр на выбранный тип коммутации
          this.selectedCommutationType = type;
          // Для контакторов не устанавливаем inputs_count, так как у них poles_count
          if (type !== 'contactors') {
            this.selectedInputs = '2';
            this.selectedPolesCount = null;
          } else {
            this.selectedInputs = null;
            // Не сбрасываем selectedPolesCount для контакторов
          }
        }
        
        this.applyFilters();
      },
      
      applyFilters() {
        let filtered = [...this.products];
        
        // Фильтр по бренду
        if (this.selectedBrand) {
          filtered = filtered.filter(p => p.brand === this.selectedBrand);
        }
        
        // Фильтр по количеству вводов (для моноблочных АВР)
        if (this.selectedInputs) {
          filtered = filtered.filter(p => p.inputs_count === this.selectedInputs);
        }
        
        // Фильтр по количеству полюсов (для контакторов)
        if (this.selectedPolesCount) {
          filtered = filtered.filter(p => p.poles_count === this.selectedPolesCount);
        }
        
        // Фильтр по типу коммутации
        if (this.selectedCommutationType) {
          filtered = filtered.filter(p => p.commutation_type === this.selectedCommutationType);
        }
        
        // Сортировка
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
              // По умолчанию сортируем по номинальному току
              if (a.nominal_current !== b.nominal_current) {
                return a.nominal_current - b.nominal_current;
              }
              
              // Для контакторов сортируем по полюсам (однофазные первые)
              if (a.commutation_type === 'contactors' && b.commutation_type === 'contactors') {
                const aPhase = a.poles_count === 'single_phase' ? 1 : 3;
                const bPhase = b.poles_count === 'single_phase' ? 1 : 3;
                if (aPhase !== bPhase) {
                  return aPhase - bPhase;
                }
              }
              
              // Для моноблочных АВР сортируем по количеству вводов
              if (a.commutation_type === 'monoblock' && b.commutation_type === 'monoblock') {
                const aInputs = parseInt(a.inputs_count) || 0;
                const bInputs = parseInt(b.inputs_count) || 0;
                if (aInputs !== bInputs) {
                  return aInputs - bInputs;
                }
              }
              
              // В конце сортируем по бренду
              return (a.brand || '').localeCompare(b.brand || '');
          }
        });
        
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
        const total = this.totalPages;
        const cur = this.currentPage;
        if (total <= 7) {
          return Array.from({length: total}, (_, i) => i + 1);
        }
        const pages = new Set([1, total, cur]);
        if (cur > 1) pages.add(cur - 1);
        if (cur < total) pages.add(cur + 1);
        const sorted = [...pages].sort((a, b) => a - b);
        const result = [];
        for (let i = 0; i < sorted.length; i++) {
          if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...');
          result.push(sorted[i]);
        }
        return result;
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
      
      getSelectedSubcategory() {
        if (this.selectedCommutationType === 'contactors') {
          return 'Шкафы АВР на контакторах';
        } else if (this.selectedCommutationType === 'monoblock' && this.selectedInputs === '2') {
          return 'Шкафы АВР на 2 ввода';
        } else if (this.selectedCommutationType === 'monoblock' && this.selectedInputs === '3') {
          return 'Шкафы АВР на 3 ввода';
        }
        return null;
      }
    };
  });
});
