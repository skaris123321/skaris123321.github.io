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
      sortBy: 'price_asc',
      loading: true,
      searchQuery: '',
      
      async init() {
        await this.loadProducts();
        this.checkUrlParams();
        // Изначально показываем все товары
        this.filteredProducts = [...this.products];
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
            
            // Проверим, есть ли товары с contactors
            const contactorsProducts = this.products.filter(p => p.commutation_type === 'contactors');
            console.log(`Товаров с commutation_type "contactors":`, contactorsProducts.length);
            
            const contactors2Inputs = this.products.filter(p => p.commutation_type === 'contactors' && p.inputs_count === '2');
            console.log(`Товаров с commutation_type "contactors" и inputs_count "2":`, contactors2Inputs.length);
            
            if (contactors2Inputs.length > 0) {
              console.log('Примеры товаров:', contactors2Inputs.slice(0, 3).map(p => ({
                id: p.id,
                article: p.article,
                brand: p.brand,
                commutation_type: p.commutation_type,
                inputs_count: p.inputs_count
              })));
            }
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
        console.log('filterByCommutationType вызван с типом:', type);
        console.log('Текущее состояние - selectedCommutationType:', this.selectedCommutationType, 'selectedInputs:', this.selectedInputs);
        
        // Если уже выбран такой же тип коммутации и 2 ввода, убираем фильтр
        if (this.selectedCommutationType === type && this.selectedInputs === '2') {
          console.log('Убираем фильтр');
          this.selectedCommutationType = null;
          this.selectedInputs = null;
        } else {
          // Иначе устанавливаем фильтр на контакторы с 2 вводами
          console.log('Устанавливаем фильтр на', type, 'с 2 вводами');
          this.selectedCommutationType = type;
          this.selectedInputs = '2';
        }
        
        console.log('Новое состояние - selectedCommutationType:', this.selectedCommutationType, 'selectedInputs:', this.selectedInputs);
        this.applyFilters();
      },

      filterBySinglePhase() {
        // Если уже выбраны однофазные АВР, убираем фильтр
        if (this.selectedCommutationType === 'single_phase_contactors') {
          this.selectedCommutationType = null;
          this.selectedInputs = null;
        } else {
          // Иначе устанавливаем фильтр на однофазные АВР на контакторах
          this.selectedCommutationType = 'single_phase_contactors';
          this.selectedInputs = '2';
        }
        this.applyFilters();
      },
      
      applyFilters() {
        console.log('applyFilters вызван');
        console.log('Фильтры - selectedBrand:', this.selectedBrand, 'selectedInputs:', this.selectedInputs, 'selectedCommutationType:', this.selectedCommutationType);
        console.log('Всего товаров:', this.products.length);
        
        let filtered = [...this.products];
        
        // Фильтр по бренду
        if (this.selectedBrand) {
          filtered = filtered.filter(p => p.brand === this.selectedBrand);
          console.log('После фильтра по бренду:', filtered.length);
        }
        
        // Фильтр по количеству вводов
        if (this.selectedInputs) {
          filtered = filtered.filter(p => p.inputs_count === this.selectedInputs);
          console.log('После фильтра по вводам:', filtered.length);
        }
        
        // Фильтр по типу коммутации
        if (this.selectedCommutationType) {
          filtered = filtered.filter(p => p.commutation_type === this.selectedCommutationType);
          console.log('После фильтра по типу коммутации:', filtered.length);
        }
        
        console.log('Итого отфильтрованных товаров:', filtered.length);
        
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
              // По умолчанию сортируем по номинальному току, потом по количеству вводов, потом по бренду
              if (a.nominal_current !== b.nominal_current) {
                return a.nominal_current - b.nominal_current;
              }
              if (a.inputs_count !== b.inputs_count) {
                return a.inputs_count.localeCompare(b.inputs_count);
              }
              return (a.brand || '').localeCompare(b.brand || '');
          }
        });
        
        this.filteredProducts = filtered;
        console.log('Финальный результат:', this.filteredProducts.length, 'товаров');
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
      }
    };
  });
});
