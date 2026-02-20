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
    
    if (searchInputs.length === 0) {
      console.log('Поисковые поля не найдены, повторная попытка через 500мс');
      setTimeout(() => this.init(), 500);
      return;
    }

    console.log('Найдено поисковых полей:', searchInputs.length);
    
    searchInputs.forEach(input => {
      // Создаем контейнер для подсказок
      const wrapper = input.parentElement;
      
      // Проверяем, не создан ли уже контейнер
      let suggestionsDiv = wrapper.querySelector('.search-suggestions');
      if (!suggestionsDiv) {
        suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'search-suggestions';
        wrapper.appendChild(suggestionsDiv);
      }

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
      // Пробуем разные пути в зависимости от текущей страницы
      let response;
      const currentPath = window.location.pathname;
      
      if (currentPath.includes('/category/')) {
        // Мы в папке category
        response = await fetch('../data/products.json');
      } else {
        // Мы в корне
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
    // Если поле пустое, скрываем подсказки
    if (!query || query.length === 0) {
      this.hideSuggestions(suggestionsDiv);
      return;
    }

    // Показываем подсказки даже для 1 символа
    const suggestions = this.getSuggestions(query);
    this.showSuggestions(suggestions, suggestionsDiv, inputElement);
  }

  getAllProductsSuggestions() {
    if (!this.productsData) return [];

    const suggestions = [];
    const maxSuggestions = 15; // Показываем больше товаров

    // Группируем товары по категориям
    const categories = {
      'monoblock': { name: 'Моноблочные АВР', items: [] },
      'contactors': { name: 'АВР на контакторах', items: [] },
      'sectional': { name: 'Секционные АВР', items: [] },
      'control_cabinet': { name: 'Шкафы управления', items: [] },
      'reactive_power': { name: 'Реактивная мощность', items: [] }
    };

    // Распределяем товары по категориям
    this.productsData.forEach(product => {
      if (categories[product.commutation_type]) {
        categories[product.commutation_type].items.push(product);
      }
    });

    // Добавляем категории с товарами
    Object.keys(categories).forEach(key => {
      const category = categories[key];
      if (category.items.length > 0) {
        // Добавляем заголовок категории
        suggestions.push({
          type: 'category_header',
          text: category.name,
          label: 'Категория',
          isHeader: true
        });

        // Добавляем несколько товаров из категории
        category.items.slice(0, 3).forEach(product => {
          const desc = product.description && product.description.length > 50 
            ? product.description.substring(0, 50) + '...' 
            : product.description || product.article;
          
          suggestions.push({
            type: 'product',
            text: desc,
            label: product.article,
            productId: product.id,
            priority: 3
          });
        });
      }
    });

    return suggestions.slice(0, maxSuggestions);
  }

  getSuggestions(query) {
    if (!this.productsData) return [];

    const searchLower = query.toLowerCase();
    const suggestions = [];
    const maxSuggestions = 50; // Увеличиваем количество показываемых вариантов
    const addedArticles = new Set();
    const addedDescriptions = new Set();

    // Сначала ищем совпадения с начала строки (приоритет)
    this.productsData.forEach(product => {
      if (suggestions.length >= maxSuggestions) return;

      // Артикулы - начинаются с запроса
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

      // Описания - начинаются с запроса
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

      // Артикулы - содержат запрос
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

      // Описания - содержат запрос
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

    // Сортируем по приоритету (меньше = выше)
    suggestions.sort((a, b) => (a.priority || 3) - (b.priority || 3));

    return suggestions;
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
      
      // Если это заголовок категории
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
          // Переход на страницу товара
          const currentPath = window.location.pathname;
          const isInCategory = currentPath.includes('/category/');
          const productPath = isInCategory ? 'product.html' : 'category/product.html';
          window.location.href = `${productPath}?id=${suggestion.productId}`;
        } else if (suggestion.url) {
          // Переход на страницу категории
          const currentPath = window.location.pathname;
          const isInCategory = currentPath.includes('/category/');
          
          // Если URL уже содержит category/, используем как есть
          if (suggestion.url.includes('category/')) {
            window.location.href = suggestion.url;
          } else {
            // Иначе добавляем category/ если нужно
            const categoryPath = isInCategory ? suggestion.url : 'category/' + suggestion.url;
            window.location.href = categoryPath;
          }
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

// Инициализируем поиск после полной загрузки страницы и Alpine.js
document.addEventListener('DOMContentLoaded', () => {
  // Ждем немного, чтобы Alpine.js успел инициализироваться
  setTimeout(() => {
    new UniversalSearch();
  }, 100);
});
