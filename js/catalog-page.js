function catalogData() {
  return {
    categories: [],
    loading: true,

    async init() {
      await this.loadCategories();
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
          const avrSubcategories = new Set();
          
          avrProducts.forEach(product => {
            if (product.commutation_type === 'monoblock') {
              if (product.inputs_count === '2') {
                avrSubcategories.add('Моноблочные АВР на 2 ввода');
              } else if (product.inputs_count === '3') {
                avrSubcategories.add('Моноблочные АВР на 3 ввода');
              }
            } else if (product.commutation_type === 'contactors') {
              if (product.poles_count === 'single_phase') {
                avrSubcategories.add('АВР на контакторах однофазные');
              } else if (product.poles_count === 'three_phase') {
                avrSubcategories.add('АВР на контакторах трёхфазные');
              }
            } else if (product.commutation_type === 'sectional') {
              avrSubcategories.add('Секционные АВР');
            }
          });

          categoryMap.set('avr', {
            type: 'avr',
            name: 'АВР',
            url: 'avr.html',
            image: '../images/avr-100.jpg',
            subcategories: Array.from(avrSubcategories).sort()
          });
        }

        // Шкафы управления
        const controlCabinets = data.products.filter(p => p.commutation_type === 'control_cabinet');
        
        if (controlCabinets.length > 0) {
          const controlSubcategories = new Set();
          
          controlCabinets.forEach(product => {
            if (product.control_type === 'soft_start') {
              controlSubcategories.add('Шкафы управления с плавным пуском');
            } else if (product.control_type === 'frequency_converter') {
              controlSubcategories.add('Шкафы управления с преобразователем частоты');
            } else if (product.control_type === 'direct_start') {
              controlSubcategories.add('Шкафы управления с прямым пуском');
            }
          });

          categoryMap.set('control_cabinets', {
            type: 'control_cabinets',
            name: 'Шкафы управления',
            url: 'control-cabinets.html',
            image: '../images/preobh1.png',
            subcategories: Array.from(controlSubcategories).sort()
          });
        }

        // Добавляем будущие категории (пока пустые)
        const futureCategories = [
          {
            type: 'vru',
            name: 'ВРУ',
            url: '#',
            image: '../images/avr-100.jpg',
            subcategories: ['Скоро в продаже']
          },
          {
            type: 'grsh',
            name: 'ГРЩ',
            url: '#',
            image: '../images/avr-100.jpg',
            subcategories: ['Скоро в продаже']
          },
          {
            type: 'ups',
            name: 'ИБП',
            url: '#',
            image: '../images/avr-100.jpg',
            subcategories: ['Скоро в продаже']
          },
          {
            type: 'stabilizers',
            name: 'Стабилизаторы напряжения',
            url: '#',
            image: '../images/avr-100.jpg',
            subcategories: ['Скоро в продаже']
          }
        ];

        // Преобразуем Map в массив
        this.categories = Array.from(categoryMap.values());
        
        // Добавляем будущие категории
        // this.categories.push(...futureCategories);

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
