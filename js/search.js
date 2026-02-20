// Универсальный поиск по сайту
console.log('search.js загружен');

class UniversalSearch {
  constructor() {
    this.productsData = null;
    this.init();
  }

  async init() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    if (searchInputs.length === 0) {
      console.log('Поисковые поля не найдены, повторная попытка через 1000мс');
      setTimeout(() => this.init(), 1000);
      return;
    }

    console.log('Найдено поисковых полей:', searchInputs.length);
    
    searchInputs.forEach((input, index) => {
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
        console.log('Загружено товаров для поиска:', this.productsData.length);
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
    console.log('Инициализация поиска...');
    new UniversalSearch();
  }, 300);
});
