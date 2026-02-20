// Универсальный поиск по сайту
class UniversalSearch {
  constructor() {
    this.productsData = null;
    this.searchInput = null;
    this.suggestionsContainer = null;
    this.init();
  }

  async init() {
    // Находим все поисковые поля на странице
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
      // Создаем контейнер для подсказок
      const wrapper = input.parentElement;
      const suggestionsDiv = document.createElement('div');
      suggestionsDiv.className = 'search-suggestions';
      wrapper.appendChild(suggestionsDiv);

      // Добавляем обработчик на ввод текста
      input.addEventListener('input', (e) => {
        this.handleInput(e.target.value.trim(), suggestionsDiv, input);
      });

      // Добавляем обработчик на Enter
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performSearch(input.value.trim());
          this.hideSuggestions(suggestionsDiv);
        }
      });

      // Закрываем подсказки при клике вне поля
      document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
          this.hideSuggestions(suggestionsDiv);
        }
      });
    });

    // Загружаем данные о товарах
    await this.loadProducts();
  }

  async loadProducts() {
    try {
      const response = await fetch('data/products.json').catch(() => 
        fetch('../data/products.json')
      );
      
      if (response.ok) {
        const data = await response.json();
        this.productsData = data.products || [];
      }
    } catch (error) {
      console.error('Ошибка загрузки данных для поиска:', error);
    }
  }

  handleInput(query, suggestionsDiv, inputElement) {
    if (!query || query.length < 2) {
      this.hideSuggestions(suggestionsDiv);
      return;
    }

    const suggestions = this.getSuggestions(query);
    this.showSuggestions(suggestions, suggestionsDiv, inputElement);
  }

  getSuggestions(query) {
    if (!this.productsData) return [];

    const searchLower = query.toLowerCase();
    const suggestions = new Set();
    const maxSuggestions = 8;

    // Собираем уникальные варианты
    this.productsData.forEach(product => {
      if (suggestions.size >= maxSuggestions) return;

      // Артикулы
      if (product.article && product.article.toLowerCase().includes(searchLower)) {
        suggestions.add({
          type: 'article',
          text: product.article,
          label: 'Артикул',
          productId: product.id
        });
      }

      // Бренды
      if (product.brand && product.brand.toLowerCase().includes(searchLower)) {
        suggestions.add({
          type: 'brand',
          text: product.brand,
          label: 'Бренд'
        });
      }

      // Описания (первые 60 символов)
      if (product.description && product.description.toLowerCase().includes(searchLower)) {
        const desc = product.description.length > 60 
          ? product.description.substring(0, 60) + '...' 
          : product.description;
        suggestions.add({
          type: 'description',
          text: desc,
          label: 'Товар',
          productId: product.id
        });
      }
    });

    // Добавляем категории
    const categories = this.getCategorySuggestions(searchLower);
    categories.forEach(cat => {
      if (suggestions.size < maxSuggestions) {
        suggestions.add(cat);
      }
    });

    return Array.from(suggestions).slice(0, maxSuggestions);
  }

  getCategorySuggestions(query) {
    const categories = [];

    // АВР
    if ('авр'.includes(query) || 'avr'.includes(query) || query.includes('авр') || query.includes('avr')) {
      categories.push({ type: 'category', text: 'АВР (Автоматический ввод резерва)', label: 'Категория', url: 'avr.html' });
    }

    // Моноблок
    if ('моноблок'.includes(query) || 'monoblock'.includes(query) || query.includes('моноблок')) {
      categories.push({ type: 'category', text: 'Моноблочные АВР', label: 'Категория', url: 'avr.html?commutationType=monoblock' });
    }

    // Контакторы
    if ('контактор'.includes(query) || 'contactors'.includes(query) || query.includes('контактор')) {
      categories.push({ type: 'category', text: 'АВР на контакторах', label: 'Категория', url: 'avr.html?commutationType=contactors' });
    }

    // Шкафы управления
    if ('управление'.includes(query) || 'control'.includes(query) || query.includes('управлен') || query.includes('шкаф')) {
      categories.push({ type: 'category', text: 'Шкафы управления', label: 'Категория', url: 'control-cabinets.html' });
    }

    // Плавный пуск
    if ('плавный'.includes(query) || 'soft'.includes(query) || query.includes('плавн')) {
      categories.push({ type: 'category', text: 'Шкафы с плавным пуском', label: 'Категория', url: 'control-cabinets.html?controlType=soft_start' });
    }

    // Преобразователь частоты
    if ('частот'.includes(query) || 'frequency'.includes(query) || query.includes('частот') || query.includes('преобразовател')) {
      categories.push({ type: 'category', text: 'Шкафы с преобразователем частоты', label: 'Категория', url: 'control-cabinets.html?controlType=frequency_converter' });
    }

    // Реактивная мощность
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
          // Переход на страницу товара
          const currentPath = window.location.pathname;
          const isInCategory = currentPath.includes('/category/');
          const productPath = isInCategory ? 'product.html' : 'category/product.html';
          window.location.href = `${productPath}?id=${suggestion.productId}`;
        } else if (suggestion.url) {
          // Переход на страницу категории
          const currentPath = window.location.pathname;
          const isInCategory = currentPath.includes('/category/');
          const categoryPath = isInCategory ? suggestion.url : 'category/' + suggestion.url;
          window.location.href = categoryPath;
        } else {
          // Поиск по тексту
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
      // Переходим на страницу каталога с результатами поиска
      const currentPath = window.location.pathname;
      const isInCategory = currentPath.includes('/category/');
      const catalogPath = isInCategory ? 'catalog.html' : 'category/catalog.html';
      
      window.location.href = `${catalogPath}?search=${encodeURIComponent(query)}`;
    } else {
      // Показываем сообщение, что ничего не найдено
      this.showNoResultsMessage(query);
    }
  }

  searchProducts(query) {
    if (!this.productsData) return [];

    return this.productsData.filter(product => {
      // Поиск по артикулу
      if (product.article && product.article.toLowerCase().includes(query)) {
        return true;
      }

      // Поиск по описанию
      if (product.description && product.description.toLowerCase().includes(query)) {
        return true;
      }

      // Поиск по бренду
      if (product.brand && product.brand.toLowerCase().includes(query)) {
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
        if (typeKeywords.some(keyword => keyword.includes(query) || query.includes(keyword))) {
          return true;
        }
      }

      // Поиск по количеству вводов
      if (product.inputs_count && query.includes(product.inputs_count)) {
        if (query.includes('ввод') || query.includes('input')) {
          return true;
        }
      }

      // Поиск по номинальному току
      if (product.nominal_current && query.includes(product.nominal_current)) {
        if (query.includes('а') || query.includes('ампер') || query.includes('amp')) {
          return true;
        }
      }

      // Поиск по типу управления
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

      // Поиск по мощности двигателя
      if (product.motor_power && query.includes(product.motor_power)) {
        if (query.includes('квт') || query.includes('кw') || query.includes('мощность')) {
          return true;
        }
      }

      // Поиск АВР
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

  showNoResultsMessage(query) {
    alert(`По запросу "${query}" ничего не найдено. Попробуйте изменить запрос.`);
  }
}

// Инициализируем поиск после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new UniversalSearch();
  });
} else {
  new UniversalSearch();
}
