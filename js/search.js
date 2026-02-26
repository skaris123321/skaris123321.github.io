// Универсальный поиск по сайту

class UniversalSearch {
  constructor() {
    this.productsData = null;
    this.init();
  }

  async init() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    if (searchInputs.length === 0) {
      setTimeout(() => this.init(), 1000);
      return;
    }
    
    searchInputs.forEach((input) => {
      const wrapper = input.parentElement;
      let suggestionsDiv = wrapper.querySelector('.search-suggestions');
      if (!suggestionsDiv) {
        suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'search-suggestions';
        wrapper.appendChild(suggestionsDiv);
      }

      input.addEventListener('input', (e) => {
        this.handleInput(e.target.value.trim(), suggestionsDiv, input);
      });

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performSearch(input.value.trim());
          this.hideSuggestions(suggestionsDiv);
        }
      });

      document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
          this.hideSuggestions(suggestionsDiv);
        }
      });
    });

    await this.loadProducts();
  }

  async loadProducts() {
    try {
      const currentPath = window.location.pathname;
      let response;
      
      if (currentPath.includes('/category/')) {
        response = await fetch('../data/products.json');
      } else {
        response = await fetch('data/products.json');
      }
      
      if (response.ok) {
        const data = await response.json();
        this.productsData = data.products || [];
      }
    } catch (error) {
      console.error('Ошибка загрузки данных для поиска:', error);
    }
  }

  handleInput(query, suggestionsDiv, inputElement) {
    if (!query || query.length === 0) {
      this.hideSuggestions(suggestionsDiv);
      return;
    }

    const suggestions = this.getSuggestions(query);
    this.showSuggestions(suggestions, suggestionsDiv, inputElement);
  }

  getSuggestions(query) {
    if (!this.productsData) return [];

    const searchLower = query.toLowerCase();
    const suggestions = [];
    const maxSuggestions = 50;
    const addedArticles = new Set();
    const addedDescriptions = new Set();

    // Сначала ищем совпадения с начала строки
    this.productsData.forEach(product => {
      if (suggestions.length >= maxSuggestions) return;

      if (product.article && product.article.toLowerCase().startsWith(searchLower)) {
        if (!addedArticles.has(product.article)) {
          suggestions.push({
            type: 'article',
            text: product.article,
            label: 'Артикул',
            productId: product.id,
            priority: 1
          });
          addedArticles.add(product.article);
        }
      }

      if (product.description && product.description.toLowerCase().startsWith(searchLower)) {
        const desc = product.description.length > 60 
          ? product.description.substring(0, 60) + '...' 
          : product.description;
        const key = product.id + '_' + desc;
        if (!addedDescriptions.has(key)) {
          suggestions.push({
            type: 'description',
            text: desc,
            label: 'Товар',
            productId: product.id,
            priority: 1
          });
          addedDescriptions.add(key);
        }
      }
    });

    // Затем ищем совпадения в любом месте строки
    this.productsData.forEach(product => {
      if (suggestions.length >= maxSuggestions) return;

      if (product.article && 
          product.article.toLowerCase().includes(searchLower) && 
          !addedArticles.has(product.article)) {
        suggestions.push({
          type: 'article',
          text: product.article,
          label: 'Артикул',
          productId: product.id,
          priority: 2
        });
        addedArticles.add(product.article);
      }

      if (product.description && 
          product.description.toLowerCase().includes(searchLower)) {
        const desc = product.description.length > 60 
          ? product.description.substring(0, 60) + '...' 
          : product.description;
        const key = product.id + '_' + desc;
        if (!addedDescriptions.has(key)) {
          suggestions.push({
            type: 'description',
            text: desc,
            label: 'Товар',
            productId: product.id,
            priority: 2
          });
          addedDescriptions.add(key);
        }
      }
    });

    // Добавляем категории
    const categories = this.getCategorySuggestions(searchLower);
    categories.forEach(cat => {
      if (suggestions.length < maxSuggestions) {
        suggestions.push(cat);
      }
    });

    suggestions.sort((a, b) => (a.priority || 3) - (b.priority || 3));
    return suggestions;
  }

  getCategorySuggestions(query) {
    const categories = [];

    if ('авр'.includes(query) || 'avr'.includes(query) || query.includes('авр') || query.includes('avr')) {
      categories.push({ type: 'category', text: 'АВР (Автоматический ввод резерва)', label: 'Категория', url: 'avr.html' });
    }

    if ('моноблок'.includes(query) || 'monoblock'.includes(query) || query.includes('моноблок')) {
      categories.push({ type: 'category', text: 'Моноблочные АВР', label: 'Категория', url: 'avr.html?commutationType=monoblock' });
    }

    if ('контактор'.includes(query) || 'contactors'.includes(query) || query.includes('контактор')) {
      categories.push({ type: 'category', text: 'АВР на контакторах', label: 'Категория', url: 'avr.html?commutationType=contactors' });
    }

    if ('управление'.includes(query) || 'control'.includes(query) || query.includes('управлен') || query.includes('шкаф')) {
      categories.push({ type: 'category', text: 'Шкафы управления', label: 'Категория', url: 'control-cabinets.html' });
    }

    if ('ящик'.includes(query) || 'ящики'.includes(query) || query.includes('ящик') || query.includes('я5000') || query.includes('я-5000')) {
      categories.push({ type: 'category', text: 'Ящики управления электродвигателями Я5000', label: 'Категория', url: 'motor-control-boxes.html' });
    }

    if ('плавный'.includes(query) || 'soft'.includes(query) || query.includes('плавн')) {
      categories.push({ type: 'category', text: 'Шкафы с плавным пуском', label: 'Категория', url: 'control-cabinets.html?controlType=soft_start' });
    }

    if ('частот'.includes(query) || 'frequency'.includes(query) || query.includes('частот') || query.includes('преобразовател')) {
      categories.push({ type: 'category', text: 'Шкафы с преобразователем частоты', label: 'Категория', url: 'control-cabinets.html?controlType=frequency_converter' });
    }

    if ('реактивн'.includes(query) || 'reactive'.includes(query) || query.includes('реактивн') || query.includes('компенсац') || query.includes('конденсатор')) {
      categories.push({ type: 'category', text: 'Компенсация реактивной мощности', label: 'Категория', url: 'reactive-power.html' });
    }

    return categories;
  }

  showSuggestions(suggestions, container, inputElement) {
    if (suggestions.length === 0) {
      this.hideSuggestions(container);
      return;
    }

    container.innerHTML = '';
    container.style.display = 'block';

    suggestions.forEach(suggestion => {
      const item = document.createElement('div');
      
      if (suggestion.isHeader) {
        item.className = 'search-suggestion-header';
        item.textContent = suggestion.text;
        container.appendChild(item);
        return;
      }

      item.className = 'search-suggestion-item';
      
      const label = document.createElement('span');
      label.className = 'suggestion-label';
      label.textContent = suggestion.label;
      
      const text = document.createElement('span');
      text.className = 'suggestion-text';
      text.textContent = suggestion.text;
      
      item.appendChild(label);
      item.appendChild(text);

      item.addEventListener('click', () => {
        if (suggestion.productId) {
          const currentPath = window.location.pathname;
          const isInCategory = currentPath.includes('/category/');
          const productPath = isInCategory ? 'product.html' : 'category/product.html';
          window.location.href = `${productPath}?id=${suggestion.productId}`;
        } else if (suggestion.url) {
          const currentPath = window.location.pathname;
          const isInCategory = currentPath.includes('/category/');
          
          if (suggestion.url.includes('category/')) {
            window.location.href = suggestion.url;
          } else {
            const categoryPath = isInCategory ? suggestion.url : 'category/' + suggestion.url;
            window.location.href = categoryPath;
          }
        } else {
          inputElement.value = suggestion.text;
          this.performSearch(suggestion.text);
        }
        this.hideSuggestions(container);
      });

      container.appendChild(item);
    });
  }

  hideSuggestions(container) {
    container.style.display = 'none';
    container.innerHTML = '';
  }

  performSearch(query) {
    if (!query || query.length < 2) {
      return;
    }

    const searchQuery = query.toLowerCase();
    
    // Сначала проверяем, есть ли точное совпадение по артикулу
    const exactArticleMatch = this.productsData.find(product => 
      product.article && product.article.toLowerCase() === searchQuery
    );
    
    if (exactArticleMatch) {
      // Если найден товар по артикулу, перенаправляем на его страницу
      const currentPath = window.location.pathname;
      const isInCategory = currentPath.includes('/category/');
      const productPath = isInCategory ? 'product.html' : 'category/product.html';
      window.location.href = `${productPath}?id=${exactArticleMatch.id}`;
      return;
    }
    
    // Проверяем точное совпадение по полному названию товара
    const exactDescriptionMatch = this.productsData.find(product => 
      product.description && product.description.toLowerCase() === searchQuery
    );
    
    if (exactDescriptionMatch) {
      // Если найден товар по названию, перенаправляем на его страницу
      const currentPath = window.location.pathname;
      const isInCategory = currentPath.includes('/category/');
      const productPath = isInCategory ? 'product.html' : 'category/product.html';
      window.location.href = `${productPath}?id=${exactDescriptionMatch.id}`;
      return;
    }
    
    // Ключевые слова для определения категорий
    const avrKeywords = ['авр', 'avr'];
    const controlKeywords = ['управлен', 'шкаф', 'control'];
    const boxKeywords = ['ящик', 'я5000', 'я-5000'];
    const reactiveKeywords = ['реактивн', 'компенсац', 'конденсатор', 'reactive'];
    
    // Ключевые слова для подкатегорий АВР
    const avrSubcategories = {
      '2_inputs': ['2 ввод', 'два ввод', '2input', 'двух вводов'],
      '3_inputs': ['3 ввод', 'три ввод', '3input', 'трех вводов'],
      'contactors': ['контактор', 'contactors'],
      'monoblock': ['моноблок', 'monoblock']
    };
    
    // Ключевые слова для подкатегорий шкафов управления
    const controlSubcategories = {
      'soft_start': ['плавный пуск', 'soft start', 'soft_start', 'плавн'],
      'frequency_converter': ['преобразователь частоты', 'частотник', 'frequency', 'преобразовател', 'частот'],
      'direct_start': ['прямой пуск', 'direct start', 'direct_start', 'прямой']
    };
    
    // Ключевые слова для подкатегорий компенсации реактивной мощности
    const reactiveSubcategories = {
      'unregulated': ['нерегулируемые', 'unregulated'],
      'regulated': ['регулируемые', 'автоматически', 'regulated']
    };
    
    // Ключевые слова для подкатегорий ящиков управления
    const boxSubcategories = {
      'single_feeder': ['однофидерн', 'single'],
      'double_feeder': ['двухфидерн', 'double'],
      'triple_feeder': ['трехфидерн', 'triple']
    };
    
    const supportedBrands = ['CHINT', 'Dekraft', 'EKF', 'Systeme electric', 'TDM', 'VEDA', 'IEK'];
    
    let detectedCategory = null;
    let detectedSubcategory = null;
    let detectedBrand = null;
    let urlParams = '';
    
    // Определяем категорию
    if (avrKeywords.some(kw => searchQuery.includes(kw))) {
      detectedCategory = 'avr';
      
      // Определяем подкатегорию АВР
      for (const [subcatKey, keywords] of Object.entries(avrSubcategories)) {
        if (keywords.some(kw => searchQuery.includes(kw))) {
          if (subcatKey === '2_inputs') {
            urlParams = 'commutationType=monoblock&inputs=2';
          } else if (subcatKey === '3_inputs') {
            urlParams = 'commutationType=monoblock&inputs=3';
          } else if (subcatKey === 'contactors') {
            urlParams = 'commutationType=contactors';
          } else if (subcatKey === 'monoblock') {
            urlParams = 'commutationType=monoblock';
          }
          break;
        }
      }
    } else if (boxKeywords.some(kw => searchQuery.includes(kw))) {
      detectedCategory = 'motor-control-boxes';
      
      // Определяем подкатегорию ящиков управления
      for (const [subcatKey, keywords] of Object.entries(boxSubcategories)) {
        if (keywords.some(kw => searchQuery.includes(kw))) {
          urlParams = `boxType=${subcatKey}`;
          break;
        }
      }
    } else if (controlKeywords.some(kw => searchQuery.includes(kw))) {
      detectedCategory = 'control-cabinets';
      
      // Определяем подкатегорию шкафов управления
      for (const [subcatKey, keywords] of Object.entries(controlSubcategories)) {
        if (keywords.some(kw => searchQuery.includes(kw))) {
          urlParams = `controlType=${subcatKey}`;
          break;
        }
      }
    } else if (reactiveKeywords.some(kw => searchQuery.includes(kw))) {
      detectedCategory = 'reactive-power';
      
      // Определяем подкатегорию компенсации реактивной мощности
      for (const [subcatKey, keywords] of Object.entries(reactiveSubcategories)) {
        if (keywords.some(kw => searchQuery.includes(kw))) {
          urlParams = `regulationType=${subcatKey}`;
          break;
        }
      }
    }
    
    // Определяем бренд
    for (const brand of supportedBrands) {
      if (searchQuery.includes(brand.toLowerCase())) {
        detectedBrand = brand;
        break;
      }
    }
    
    // Если найдена категория, перенаправляем на страницу категории
    if (detectedCategory) {
      const currentPath = window.location.pathname;
      const isInCategory = currentPath.includes('/category/');
      const categoryPath = isInCategory ? `${detectedCategory}.html` : `category/${detectedCategory}.html`;
      
      // Добавляем параметры подкатегории и бренда
      let fullUrl = categoryPath;
      if (urlParams || detectedBrand) {
        fullUrl += '?';
        if (urlParams) {
          fullUrl += urlParams;
        }
        if (detectedBrand) {
          fullUrl += (urlParams ? '&' : '') + `brand=${encodeURIComponent(detectedBrand)}`;
        }
      }
      
      window.location.href = fullUrl;
      return;
    }
    
    // Если категория не определена, ищем товары в каталоге
    const results = this.searchProducts(searchQuery);

    if (results.length > 0) {
      const currentPath = window.location.pathname;
      const isInCategory = currentPath.includes('/category/');
      const catalogPath = isInCategory ? 'catalog.html' : 'category/catalog.html';
      
      window.location.href = `${catalogPath}?search=${encodeURIComponent(query)}`;
    } else {
      alert(`По запросу "${query}" ничего не найдено. Попробуйте изменить запрос.`);
    }
  }

  searchProducts(query) {
    if (!this.productsData) return [];

    return this.productsData.filter(product => {
      if (product.article && product.article.toLowerCase().includes(query)) {
        return true;
      }

      if (product.description && product.description.toLowerCase().includes(query)) {
        return true;
      }

      if (product.brand && product.brand.toLowerCase().includes(query)) {
        return true;
      }

      const commutationTypes = {
        'monoblock': ['моноблок', 'моноблочный', 'monoblock'],
        'contactors': ['контактор', 'контакторы', 'contactors'],
        'sectional': ['секционный', 'sectional'],
        'control_cabinet': ['шкаф управления', 'управление', 'control'],
        'motor_control_box': ['ящик управления', 'ящик', 'я5000', 'я-5000', 'motor control'],
        'reactive_power': ['реактивная мощность', 'компенсация', 'reactive', 'конденсатор']
      };

      if (product.commutation_type) {
        const typeKeywords = commutationTypes[product.commutation_type] || [];
        if (typeKeywords.some(keyword => keyword.includes(query) || query.includes(keyword))) {
          return true;
        }
      }

      if (product.inputs_count && query.includes(product.inputs_count)) {
        if (query.includes('ввод') || query.includes('input')) {
          return true;
        }
      }

      if (product.nominal_current && query.includes(product.nominal_current)) {
        if (query.includes('а') || query.includes('ампер') || query.includes('amp')) {
          return true;
        }
      }

      const controlTypes = {
        'soft_start': ['плавный пуск', 'soft start'],
        'frequency_converter': ['преобразователь частоты', 'частотник', 'frequency'],
        'direct_start': ['прямой пуск', 'direct start']
      };

      if (product.control_type) {
        const controlKeywords = controlTypes[product.control_type] || [];
        if (controlKeywords.some(keyword => keyword.includes(query) || query.includes(keyword))) {
          return true;
        }
      }

      if (product.motor_power && query.includes(product.motor_power)) {
        if (query.includes('квт') || query.includes('кw') || query.includes('мощность')) {
          return true;
        }
      }

      if (query.includes('авр') || query.includes('avr')) {
        if (product.commutation_type === 'monoblock' || 
            product.commutation_type === 'contactors' || 
            product.commutation_type === 'sectional') {
          return true;
        }
      }

      return false;
    });
  }
}

// Инициализируем поиск после полной загрузки страницы
window.addEventListener('load', () => {
  setTimeout(() => {
    new UniversalSearch();
  }, 300);
});
