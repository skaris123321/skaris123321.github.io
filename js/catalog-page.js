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
          const avrSubcategories = [];
          
          // Моноблочные АВР на 2 ввода
          if (avrProducts.some(p => p.commutation_type === 'monoblock' && p.inputs_count === '2')) {
            avrSubcategories.push({
              name: 'Моноблочные АВР на 2 ввода',
              url: 'avr.html?commutationType=monoblock&inputs=2'
            });
          }
          
          // Моноблочные АВР на 3 ввода
          if (avrProducts.some(p => p.commutation_type === 'monoblock' && p.inputs_count === '3')) {
            avrSubcategories.push({
              name: 'Моноблочные АВР на 3 ввода',
              url: 'avr.html?commutationType=monoblock&inputs=3'
            });
          }
          
          // АВР на контакторах однофазные
          if (avrProducts.some(p => p.commutation_type === 'contactors' && p.poles_count === 'single_phase')) {
            avrSubcategories.push({
              name: 'АВР на контакторах однофазные',
              url: 'avr.html?commutationType=contactors&poles=single_phase'
            });
          }
          
          // АВР на контакторах трёхфазные
          if (avrProducts.some(p => p.commutation_type === 'contactors' && p.poles_count === 'three_phase')) {
            avrSubcategories.push({
              name: 'АВР на контакторах трёхфазные',
              url: 'avr.html?commutationType=contactors&poles=three_phase'
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
