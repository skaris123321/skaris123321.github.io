function catalogData() {
  return {
    categories: [],
    loading: true,
    searchQuery: '',
    searchResults: [],
    isSearchMode: false,

    async init() {
      // Проверяем, есть ли параметр поиска в URL
      const urlParams = new URLSearchParams(window.location.search);
      const searchParam = urlParams.get('search');
      
      if (searchParam) {
        this.searchQuery = searchParam;
        this.isSearchMode = true;
        await this.performSearch(searchParam);
      } else {
        await this.loadCategories();
      }
    },

    async performSearch(query) {
      try {
        const api = new ProductsAPI();
        const data = await api.loadProducts();
        
        const searchLower = query.toLowerCase();
        
        // Фильтруем товары по поисковому запросу
        this.searchResults = data.products.filter(product => {
          // Поиск по артикулу
          if (product.article && product.article.toLowerCase().includes(searchLower)) {
            return true;
          }

          // Поиск по описанию
          if (product.description && product.description.toLowerCase().includes(searchLower)) {
            return true;
          }

          // Поиск по бренду
          if (product.brand && product.brand.toLowerCase().includes(searchLower)) {
            return true;
          }

          // Поиск по типу коммутации
          const commutationTypes = {
            'monoblock': ['моноблок', 'моноблочный', 'monoblock'],
            'contactors': ['контактор', 'контакторы', 'contactors'],
            'sectional': ['секционный', 'sectional'],
            'control_cabinet': ['шкаф управления', 'управление', 'control'],
            'reactive_power': ['реактивная мощность', 'компенсация', 'reactive', 'конденсатор']
          };

          if (product.commutation_type) {
            const typeKeywords = commutationTypes[product.commutation_type] || [];
            if (typeKeywords.some(keyword => keyword.includes(searchLower) || searchLower.includes(keyword))) {
              return true;
            }
          }

          // Поиск АВР
          if (searchLower.includes('авр') || searchLower.includes('avr')) {
            if (product.commutation_type === 'monoblock' || 
                product.commutation_type === 'contactors' || 
                product.commutation_type === 'sectional') {
              return true;
            }
          }

          return false;
        });

        this.loading = false;
        console.log(`Найдено товаров: ${this.searchResults.length}`);
      } catch (error) {
        console.error('Ошибка поиска:', error);
        this.loading = false;
      }
    },

    getProductUrl(product) {
      return `product.html?id=${product.id}`;
    },

    formatPrice(price) {
      return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    },

    async loadCategories() {
      try {
        const api = new ProductsAPI();
        const data = await api.loadProducts();
        
        // Собираем уникальные категории из products.json
        const categoryMap = new Map();

        // АВР категории
        const avrProducts = data.products.filter(p => 
          p.commutation_type === 'monoblock' || 
          p.commutation_type === 'contactors' || 
          p.commutation_type === 'sectional'
        );
        
        if (avrProducts.length > 0) {
          const avrSubcategories = [];
          
          // Шкафы АВР на 2 ввода
          if (avrProducts.some(p => p.commutation_type === 'monoblock' && p.inputs_count === '2')) {
            avrSubcategories.push({
              name: 'Шкафы АВР на 2 ввода',
              url: 'avr.html?commutationType=monoblock&inputs=2'
            });
          }
          
          // Шкафы АВР на 3 ввода
          if (avrProducts.some(p => p.commutation_type === 'monoblock' && p.inputs_count === '3')) {
            avrSubcategories.push({
              name: 'Шкафы АВР на 3 ввода',
              url: 'avr.html?commutationType=monoblock&inputs=3'
            });
          }
          
          // Шкафы АВР на контакторах (объединенная категория)
          if (avrProducts.some(p => p.commutation_type === 'contactors')) {
            avrSubcategories.push({
              name: 'Шкафы АВР на контакторах',
              url: 'avr.html?commutationType=contactors'
            });
          }
          
          // Секционные АВР
          if (avrProducts.some(p => p.commutation_type === 'sectional')) {
            avrSubcategories.push({
              name: 'Секционные АВР',
              url: 'avr.html?commutationType=sectional'
            });
          }

          categoryMap.set('avr', {
            type: 'avr',
            name: 'АВР',
            url: 'avr.html',
            image: '../images/avr-100.jpg',
            subcategories: avrSubcategories
          });
        }

        // Шкафы управления
        const controlCabinets = data.products.filter(p => p.commutation_type === 'control_cabinet');
        
        if (controlCabinets.length > 0) {
          const controlSubcategories = [];
          
          // Плавный пуск
          if (controlCabinets.some(p => p.control_type === 'soft_start')) {
            controlSubcategories.push({
              name: 'Шкафы управления с плавным пуском',
              url: 'control-cabinets.html?controlType=soft_start'
            });
          }
          
          // Преобразователь частоты
          if (controlCabinets.some(p => p.control_type === 'frequency_converter')) {
            controlSubcategories.push({
              name: 'Шкафы управления с преобразователем частоты',
              url: 'control-cabinets.html?controlType=frequency_converter'
            });
          }
          
          // Прямой пуск
          if (controlCabinets.some(p => p.control_type === 'direct_start')) {
            controlSubcategories.push({
              name: 'Шкафы управления с прямым пуском',
              url: 'control-cabinets.html?controlType=direct_start'
            });
          }

          categoryMap.set('control_cabinets', {
            type: 'control_cabinets',
            name: 'Шкафы управления',
            url: 'control-cabinets.html',
            image: '../images/preobh1.png',
            subcategories: controlSubcategories
          });
        }

        // Ящики управления электродвигателями Я5000
        const motorControlBoxes = data.products.filter(p => p.commutation_type === 'motor_control_box');
        
        if (motorControlBoxes.length > 0) {
          const motorControlSubcategories = [];
          
          // Однофидерные
          if (motorControlBoxes.some(p => p.box_type === 'single_feeder')) {
            motorControlSubcategories.push({
              name: 'Ящики управления Я5000 однофидерные',
              url: 'motor-control-boxes.html?boxType=single_feeder'
            });
          }
          
          // Двухфидерные
          if (motorControlBoxes.some(p => p.box_type === 'double_feeder')) {
            motorControlSubcategories.push({
              name: 'Ящики управления Я5000 двухфидерные',
              url: 'motor-control-boxes.html?boxType=double_feeder'
            });
          }
          
          // Трехфидерные нереверсивные
          if (motorControlBoxes.some(p => p.box_type === 'triple_feeder')) {
            motorControlSubcategories.push({
              name: 'Ящики управления Я5000 трехфидерные нереверсивные',
              url: 'motor-control-boxes.html?boxType=triple_feeder'
            });
          }

          categoryMap.set('motor_control_boxes', {
            type: 'motor_control_boxes',
            name: 'Ящики управления электродвигателями Я5000',
            url: 'motor-control-boxes.html',
            image: '../images/upr-ilektr.jpg',
            subcategories: motorControlSubcategories
          });
        }

        // Компенсация реактивной мощности (всегда показываем)
        categoryMap.set('reactive_power', {
          type: 'reactive_power',
          name: 'Компенсация реактивной мощности',
          url: 'reactive-power.html',
          image: '../images/nky.jpg',
          subcategories: [
            {
              name: 'Нерегулируемые конденсаторные установки',
              url: 'reactive-power.html?regulationType=unregulated'
            },
            {
              name: 'Автоматически регулируемые конденсаторные установки',
              url: 'reactive-power.html?regulationType=regulated'
            }
          ]
        });

        // Преобразуем Map в массив
        this.categories = Array.from(categoryMap.values());

        this.loading = false;
        
        console.log('Загружено категорий:', this.categories.length);
        console.log('Категории:', this.categories);
      } catch (error) {
        console.error('Ошибка загрузки каталога:', error);
        this.loading = false;
      }
    }
  };
}
