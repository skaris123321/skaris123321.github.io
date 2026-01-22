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
            
            // Проверим товары с контакторами
            const contactorProducts = this.products.filter(p => p.commutation_type === 'contactors');
            console.log(`Товаров с контакторами: ${contactorProducts.length}`);
            
            // Проверим товары с контакторами и 2 вводами
            const contactorTwoInputs = this.products.filter(p => p.commutation_type === 'contactors' && p.inputs_count === '2');
            console.log(`Товаров с контакторами и 2 вводами: ${contactorTwoInputs.length}`);
            
            if (contactorTwoInputs.length > 0) {
              console.log('Первые 3 товара с контакторами и 2 вводами:', contactorTwoInputs.slice(0, 3).map(p => ({
                id: p.id,
                article: p.article,
                inputs_count: p.inputs_count,
                commutation_type: p.commutation_type,
                brand: p.brand
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
        console.log('filterByCommutationType вызван с:', type);
        console.log('Текущее состояние:', {
          selectedCommutationType: this.selectedCommutationType,
          selectedInputs: this.selectedInputs
        });
        
        // Если уже выбран такой же тип коммутации и 2 ввода, убираем фильтр
        if (this.selectedCommutationType === type && this.selectedInputs === '2') {
          this.selectedCommutationType = null;
          this.selectedInputs = null;
        } else {
          // Иначе устанавливаем фильтр на контакторы с 2 вводами
          this.selectedCommutationType = type;
          this.selectedInputs = '2';
        }
        
        console.log('Новое состояние:', {
          selectedCommutationType: this.selectedCommutationType,
          selectedInputs: this.selectedInputs
        });
        
        this.applyFilters();
      },
      
      applyFilters() {
        let filtered = [...this.products];
        
        console.log('applyFilters - начальное количество товаров:', filtered.length);
        console.log('Фильтры:', {
          selectedBrand: this.selectedBrand,
          selectedInputs: this.selectedInputs,
          selectedCommutationType: this.selectedCommutationType
        });
        
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
          console.log('После фильтра по коммутации:', filtered.length);
          
          // Покажем первые несколько товаров для отладки
          if (filtered.length > 0) {
            console.log('Первые 3 отфильтрованных товара:', filtered.slice(0, 3).map(p => ({
              id: p.id,
              article: p.article,
              inputs_count: p.inputs_count,
              commutation_type: p.commutation_type,
              brand: p.brand
            })));
          }
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
