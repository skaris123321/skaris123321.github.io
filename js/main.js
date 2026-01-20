if (typeof window.solveSimpleChallenge === 'undefined') {
  window.solveSimpleChallenge = () => null;
}

// Инициализируем API для работы с продуктами
let productsAPI = null;

// Создаем экземпляр API после загрузки страницы
if (typeof ProductsAPI !== 'undefined') {
  productsAPI = new ProductsAPI();
} else {
  // Если ProductsAPI не загружен, используем встроенную версию
  class ProductsAPI {
    constructor() {
      this.productsData = null;
      this.loadPromise = null;
    }

    async loadProducts() {
      if (this.productsData) return this.productsData;
      if (this.loadPromise) return this.loadPromise;

      this.loadPromise = fetch('../data/products.json')
        .then(r => r.ok ? r.json() : Promise.reject(new Error(`Failed: ${r.status}`)))
        .then(data => {
          if (!data?.products) throw new Error('Invalid JSON format');
          this.productsData = data;
          return data;
        })
        .catch(err => {
          this.loadPromise = null;
          throw err;
        });

      return this.loadPromise;
    }

    async getAvailableOptions(filters = {}) {
      const data = await this.loadProducts();
      const { manufacturer_brand, commutation_type, inputs_count } = filters;

      let filtered = data.products;
      if (manufacturer_brand) filtered = filtered.filter(p => p.brand === manufacturer_brand);
      if (commutation_type) filtered = filtered.filter(p => p.commutation_type === commutation_type);
      if (inputs_count) filtered = filtered.filter(p => p.inputs_count === inputs_count);

      const opts = {
        manufacturer_brand: [...new Set(data.products.map(p => p.brand).filter(Boolean))].sort(),
        commutation_type: [],
        inputs_count: [],
        nominal_current: []
      };

      let typeProducts = data.products;
      if (manufacturer_brand) typeProducts = typeProducts.filter(p => p.brand === manufacturer_brand);
      opts.commutation_type = [...new Set(typeProducts.map(p => p.commutation_type).filter(Boolean))].sort();

      let inputsProducts = data.products;
      if (manufacturer_brand) inputsProducts = inputsProducts.filter(p => p.brand === manufacturer_brand);
      if (commutation_type) inputsProducts = inputsProducts.filter(p => p.commutation_type === commutation_type);
      opts.inputs_count = [...new Set(inputsProducts.map(p => p.inputs_count).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));

      let currentProducts = data.products;
      if (manufacturer_brand) currentProducts = currentProducts.filter(p => p.brand === manufacturer_brand);
      if (commutation_type) currentProducts = currentProducts.filter(p => p.commutation_type === commutation_type);
      if (inputs_count) currentProducts = currentProducts.filter(p => p.inputs_count === inputs_count);
      opts.nominal_current = [...new Set(currentProducts.map(p => parseInt(p.nominal_current)).filter(Boolean))].sort((a, b) => a - b);

      return { success: true, available_options: opts };
    }

    async getProduct(filters) {
      const data = await this.loadProducts();
      const { nominal_current, commutation_type, manufacturer_brand, inputs_count } = filters;

      if (!nominal_current) throw new Error('nominal_current required');

      const product = data.products.find(p => {
        if (parseInt(p.nominal_current) !== parseInt(nominal_current)) return false;
        if (commutation_type && p.commutation_type !== commutation_type) return false;
        if (manufacturer_brand && p.brand !== manufacturer_brand) return false;
        if (inputs_count && p.inputs_count !== inputs_count) return false;
        return true;
      });

      if (!product) return { success: false, message: 'Товар не найден' };

      return {
        success: true,
        product: {
          id: product.id,
          article: product.article || '',
          nominal_current: parseInt(product.nominal_current),
          commutation_type: product.commutation_type,
          manufacturer_brand: product.brand,
          inputs_count: product.inputs_count,
          base_price: parseInt(product.base_price || 0),
          main_image: product.main_image || (product.images?.[0] || null),
          images: product.images || (product.main_image ? [product.main_image] : []),
          description: product.description || '',
          full_description: product.full_description || product.description || '',
          documentation: product.documentation || [],
          specs: product.specs || {}
        }
      };
    }
  }

  productsAPI = new ProductsAPI();
}

document.addEventListener('alpine:init', () => {
  console.log('РОСЭК сайт запущен');
  
  Alpine.data('productData', () => {
    return {
      currentIndex: 0,
      images: ['../images/avr-100.jpg'],
      thumbnailScroll: 0,
      // Параметры выбора товара:
      // Сначала бренд производителя, затем тип коммутации, затем количество вводов и номинальный ток
      manufacturerBrand: 'CHINT',
      commutationType: 'monoblock',
      nominalCurrent: '100',
      inputsCount: '2', // "2" или "3"
      cableConnection: 'poles', // 'poles' или 'terminals'
      climateVersion: 'UXL4', // 'UXL4' или 'U2'
      basePrice: 87900,
      article: 'АВР-100-CHINT-2',
      loading: false,
      productSpecs: {},
      fullDescription: '',
      documentation: [],
      activeTab: 'specs',
      availableOptions: {
        nominal_current: [],
        commutation_type: [],
        manufacturer_brand: [],
        inputs_count: []
      },
      cartQuantity: 0, // Количество этого товара в корзине
      
      
      async init() {
        // Загружаем доступные опции с учетом выбранного бренда по умолчанию
        await this.loadAvailableOptions();
        
        // Убеждаемся, что тип коммутации доступен для выбранного бренда
        if (!this.isOptionAvailable('commutation_type', this.commutationType)) {
          if (this.availableOptions.commutation_type?.[0]) {
            this.commutationType = this.availableOptions.commutation_type[0];
            await this.loadAvailableOptions();
          }
        }
        
        // Убеждаемся, что количество вводов доступно
        if (!this.isOptionAvailable('inputs_count', this.inputsCount)) {
          if (this.availableOptions.inputs_count?.[0]) {
            this.inputsCount = this.availableOptions.inputs_count[0];
            await this.loadAvailableOptions();
          }
        }
        
        // Убеждаемся, что номинальный ток доступен
        if (!this.isOptionAvailable('nominal_current', this.nominalCurrent)) {
          if (this.availableOptions.nominal_current?.[0]) {
            this.nominalCurrent = String(this.availableOptions.nominal_current[0]);
          }
        }
        
        // Затем загружаем товар
        await this.loadProduct();
        
        // Инициализируем корзину
        this.initCart();
      },
      
      async loadAvailableOptions() {
        try {
          if (!productsAPI) {
            throw new Error('ProductsAPI не инициализирован');
          }

          const filters = {};
          if (this.manufacturerBrand) filters.manufacturer_brand = this.manufacturerBrand;
          if (this.commutationType) filters.commutation_type = this.commutationType;
          if (this.inputsCount) filters.inputs_count = this.inputsCount;

          const data = await productsAPI.getAvailableOptions(filters);
          
          if (data.success && data.available_options) {
            this.availableOptions = {
              nominal_current: data.available_options.nominal_current || [],
              commutation_type: data.available_options.commutation_type || [],
              manufacturer_brand: data.available_options.manufacturer_brand || [],
              inputs_count: data.available_options.inputs_count || []
            };
            console.log('Доступные опции загружены:', this.availableOptions);
          } else {
            this.availableOptions = {
              nominal_current: [],
              commutation_type: [],
              manufacturer_brand: [],
              inputs_count: []
            };
          }
        } catch (error) {
          console.error('Ошибка при загрузке доступных опций:', error);
          this.availableOptions = {
            nominal_current: [],
            commutation_type: [],
            manufacturer_brand: [],
            inputs_count: []
          };
        }
      },
      
      // Проверка доступности опции
      isOptionAvailable(optionType, value) {
        // Бренды всегда доступны
        if (optionType === 'manufacturer_brand') return true;
        
        // Проверяем наличие массива опций
        if (!this.availableOptions[optionType] || !Array.isArray(this.availableOptions[optionType])) {
          return false;
        }
        
        // Проверяем, что массив не пустой (для типа коммутации и количества вводов нужно хотя бы что-то быть доступным)
        if (this.availableOptions[optionType].length === 0) {
          return false;
        }
        
        if (optionType === 'nominal_current') {
          return this.availableOptions[optionType].includes(parseInt(value));
        }
        
        return this.availableOptions[optionType].includes(value);
      },
      
      async loadProduct() {
        this.loading = true;
        
        try {
          if (!productsAPI) {
            throw new Error('ProductsAPI не инициализирован');
          }

          const filters = {
            manufacturer_brand: this.manufacturerBrand,
            commutation_type: this.commutationType,
            nominal_current: this.nominalCurrent,
            inputs_count: this.inputsCount
          };

          const data = await productsAPI.getProduct(filters);
          
          if (data.success && data.product) {
            const product = data.product;
            
            // Обновляем данные товара
            this.basePrice = product.base_price;
            this.article = product.article;
            // Формируем массив изображений: используем images, если есть, иначе main_image
            const imageList = product.images && product.images.length > 0 
              ? product.images 
              : (product.main_image ? [product.main_image] : []);
            
            this.images = imageList.map(img => {
              // Если путь относительный, добавляем ../
              return img.startsWith('images/') ? '../' + img : img;
            });
            this.productSpecs = product.specs || {};
            this.fullDescription = product.full_description || product.description || '';
            this.documentation = (product.documentation || []).map(doc => {
              // Если путь относительный, добавляем ../
              return doc.startsWith('docs/') ? '../' + doc : doc;
            });
            
            // Обновляем текущие значения из загруженного товара
            this.nominalCurrent = String(product.nominal_current);
            this.commutationType = product.commutation_type;
            this.manufacturerBrand = product.manufacturer_brand;
            this.inputsCount = product.inputs_count;
            
            // Сбрасываем индекс изображения
            this.currentIndex = 0;
            this.thumbnailScroll = 0;
            
            // Перезагружаем доступные опции после загрузки товара для актуализации доступных значений
            await this.loadAvailableOptions();
            
            console.log('Товар загружен:', product);
          } else {
            console.error('Ошибка загрузки товара:', data.message);
          }
        } catch (error) {
          console.error('Ошибка при загрузке товара:', error);
        } finally {
          this.loading = false;
        }
      },
      
      // Метод для обновления номинального тока
      async updateNominalCurrent(value) {
        if (this.loading || !this.isOptionAvailable('nominal_current', value)) return;
        this.nominalCurrent = value;
        await this.loadProduct();
        this.updateCartQuantity(); // Обновляем количество в корзине
      },
      
      // Метод для обновления типа коммутации
      async updateCommutationType(value) {
        if (this.loading || !this.isOptionAvailable('commutation_type', value)) return;
        this.loading = true;
        this.commutationType = value;
        
        try {
          // Перезагружаем доступные опции с учетом нового типа коммутации
          await this.loadAvailableOptions();
          
          // Выбираем первое доступное количество вводов
          if (this.availableOptions.inputs_count && this.availableOptions.inputs_count.length > 0) {
            this.inputsCount = this.availableOptions.inputs_count[0];
            await this.loadAvailableOptions(); // Перезагружаем опции с учетом количества вводов
          }
          
          // Выбираем первый доступный ток
          if (this.availableOptions.nominal_current && this.availableOptions.nominal_current.length > 0) {
            this.nominalCurrent = String(this.availableOptions.nominal_current[0]);
          }
          
          await this.loadProduct();
          this.updateCartQuantity(); // Обновляем количество в корзине
        } finally {
          this.loading = false;
        }
      },
      
      // Метод для обновления бренда (все бренды всегда доступны)
      async updateManufacturerBrand(value) {
        if (this.loading) return;
        this.loading = true;
        this.manufacturerBrand = value;
        
        try {
          // При смене бренда перезагружаем опции и выбираем первые доступные
          await this.loadAvailableOptions();
          
          // Выбираем первый доступный тип коммутации для нового бренда
          if (this.availableOptions.commutation_type && this.availableOptions.commutation_type.length > 0) {
            this.commutationType = this.availableOptions.commutation_type[0];
            await this.loadAvailableOptions(); // Перезагружаем опции с учетом типа коммутации
          } else {
            // Если нет доступных типов коммутации, оставляем текущий
            await this.loadAvailableOptions();
          }
          
          // Выбираем первое доступное количество вводов
          if (this.availableOptions.inputs_count && this.availableOptions.inputs_count.length > 0) {
            this.inputsCount = this.availableOptions.inputs_count[0];
            await this.loadAvailableOptions(); // Перезагружаем опции с учетом количества вводов
          }
          
          // Выбираем первый доступный номинальный ток
          if (this.availableOptions.nominal_current && this.availableOptions.nominal_current.length > 0) {
            this.nominalCurrent = String(this.availableOptions.nominal_current[0]);
          }
          
          await this.loadProduct();
          this.updateCartQuantity(); // Обновляем количество в корзине
        } finally {
          this.loading = false;
        }
      },
      
      // Метод для обновления количества вводов
      async updateInputsCount(value) {
        if (this.loading || !this.isOptionAvailable('inputs_count', value)) return;
        this.loading = true;
        this.inputsCount = value;
        
        try {
          // Перезагружаем доступные опции с учетом нового количества вводов
          await this.loadAvailableOptions();
          
          // Если текущий ток недоступен, выбираем первый доступный
          if (!this.isOptionAvailable('nominal_current', this.nominalCurrent)) {
            if (this.availableOptions.nominal_current && this.availableOptions.nominal_current.length > 0) {
              this.nominalCurrent = String(this.availableOptions.nominal_current[0]);
            }
          }
          
          await this.loadProduct();
          this.updateCartQuantity(); // Обновляем количество в корзине
        } finally {
          this.loading = false;
        }
      },
      
      // Итоговая цена = базовая цена + дополнительные опции (БЕЗ умножения на количество)
      get totalPrice() {
        let price = this.basePrice;
        
        // Добавляем стоимость дополнительных опций
        if (this.cableConnection === 'terminals') {
          price += 1000;
        }
        if (this.climateVersion === 'U2') {
          price += 23000;
        }
        
        return price; // Убрали умножение на quantity
      },

      // Обновляем подключение кабеля
      updateCableConnection(value) {
        this.cableConnection = value;
        this.updateCartQuantity();
      },

      // Обновляем климатическое исполнение
      updateClimateVersion(value) {
        this.climateVersion = value;
        this.updateCartQuantity();
      },
      
      // Динамическое название товара
      get productTitle() {
        return `Шкаф АВР ${this.nominalCurrent || '100'}А на ${this.inputsCount || '2'} ввода`;
      },
      
      // Все выбранные характеристики для отображения
      // ВАЖНО: Все характеристики берутся из products.json -> specs
      // Редактируйте только products.json, здесь только добавляются динамические параметры выбора
      get allSelectedSpecs() {
        // Начинаем с характеристик из JSON (products.json -> specs)
        const specs = this.productSpecs ? { ...this.productSpecs } : {};
        
        // Добавляем только динамические параметры, которые зависят от выбора пользователя
        specs['Артикул'] = this.article || '';
        specs['Производитель'] = this.manufacturerBrand || '';
        specs['Количество вводов'] = `${this.inputsCount}`;
        specs['Тип коммутации'] = this.commutationType === 'monoblock' ? 'Моноблочный АВР' : 'Контакторы';
        specs['Подключение кабеля'] = this.cableConnection === 'poles' ? 'К полюсам автомата' : 'На дополнительные клеммы';
        specs['Климатическое исполнение'] = this.climateVersion === 'UXL4' ? 'УХЛ4 - сухие теплые помещения' : 'У2 - уличное с обогревом';
        
        return specs;
      },
      
      get maxScroll() {
        return Math.max(0, this.images.length - 4);
      },
      
      scrollThumbnailsUp() {
        if (this.thumbnailScroll > 0) {
          this.thumbnailScroll--;
        }
      },
      
      scrollThumbnailsDown() {
        if (this.thumbnailScroll < this.maxScroll) {
          this.thumbnailScroll++;
        }
      },
      
      copyArticle() {
        navigator.clipboard.writeText(this.article).then(() => {
          alert('Артикул скопирован!');
        }).catch(err => {
          console.error('Ошибка копирования:', err);
        });
      },

      // Инициализация корзины
      initCart() {
        this.updateCartQuantity();
        
        // Слушаем изменения корзины
        window.addEventListener('cartChanged', () => {
          this.updateCartQuantity();
        });
      },

      // Обновляем количество текущего товара в корзине
      updateCartQuantity() {
        if (window.cart) {
          const currentProduct = this.getCurrentProduct();
          this.cartQuantity = window.cart.hasItem(currentProduct);
        }
      },

      // Получаем текущий товар со всеми характеристиками
      getCurrentProduct() {
        return {
          article: this.article,
          manufacturerBrand: this.manufacturerBrand,
          commutationType: this.commutationType,
          nominalCurrent: this.nominalCurrent,
          inputsCount: this.inputsCount,
          cableConnection: this.cableConnection,
          climateVersion: this.climateVersion,
          basePrice: this.basePrice,
          totalPrice: this.totalPrice, // Цена за единицу (без количества)
          images: this.images,
          productSpecs: this.productSpecs,
          productTitle: this.productTitle
        };
      },

      // Добавляем товар в корзину
      addToCart() {
        if (window.cart) {
          const currentProduct = this.getCurrentProduct();
          const oldQuantity = window.cart.hasItem(currentProduct);
          
          window.cart.addItem(currentProduct, 1);
          
          // Показываем уведомление с правильным количеством
          const newQuantity = window.cart.hasItem(currentProduct);
          this.showCartNotification(newQuantity, oldQuantity);
        }
      },

      // Показываем уведомление о добавлении в корзину
      showCartNotification(newQuantity, oldQuantity) {
        let message;
        if (oldQuantity === 0) {
          message = `Товар добавлен в корзину!<br><small>В корзине: ${newQuantity} шт.</small>`;
        } else {
          message = `Количество обновлено!<br><small>В корзине: ${newQuantity} шт.</small>`;
        }
        this.showModal({
          type: 'success',
          title: 'Успешно!',
          message: message,
          showCancel: false,
          confirmText: 'ОК'
        });
      },

      // Универсальная система модальных окон
      showModal(options) {
        const {
          type = 'info',
          title = 'Подтверждение',
          message = '',
          showCancel = true,
          confirmText = 'Подтвердить',
          cancelText = 'Отмена',
          onConfirm = null,
          onCancel = null
        } = options;

        // Удаляем предыдущие модальные окна
        const existingModals = document.querySelectorAll('.universal-modal');
        existingModals.forEach(modal => modal.remove());

        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'universal-modal modal-overlay show';
        
        const iconSvg = type === 'success' ? 
          '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' :
          type === 'warning' ?
          '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>' :
          '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

        modal.innerHTML = `
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-icon modal-icon-${type}">
                ${iconSvg}
              </div>
              <h3 class="modal-title">${title}</h3>
            </div>
            <div class="modal-message">${message}</div>
            <div class="modal-actions">
              ${showCancel ? `<button class="modal-btn modal-btn-cancel">${cancelText}</button>` : ''}
              <button class="modal-btn modal-btn-confirm">${confirmText}</button>
            </div>
          </div>
        `;

        // Добавляем обработчики событий
        const cancelBtn = modal.querySelector('.modal-btn-cancel');
        const confirmBtn = modal.querySelector('.modal-btn-confirm');

        if (cancelBtn) {
          cancelBtn.addEventListener('click', () => {
            modal.remove();
            if (onCancel && typeof onCancel === 'function') {
              onCancel();
            }
          });
        }

        if (confirmBtn) {
          confirmBtn.addEventListener('click', () => {
            modal.remove();
            if (onConfirm && typeof onConfirm === 'function') {
              onConfirm();
            }
          });
        }

        // Закрытие по клику вне окна
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.remove();
            if (onCancel && typeof onCancel === 'function') {
              onCancel();
            }
          }
        });

        // Добавляем в body
        document.body.appendChild(modal);

        // Автоматически закрываем уведомления (не подтверждения) через 3 секунды
        if (!showCancel) {
          setTimeout(() => {
            if (modal.parentNode) {
              modal.remove();
            }
          }, 3000);
        }
      },
      
      // Получение описания в зависимости от типа коммутации
      getCommutationDescription() {
        if (this.commutationType === 'contactors') {
          return {
            purpose: `Шкаф АВР (автоматического ввода резерва) на базе контакторов предназначен для обеспечения бесперебойного электроснабжения потребителей путём автоматического переключения между основным и резервным вводами. Основные функции:`,
            purposeList: [
              'автоматическое переключение на резервный источник при пропадании или недопустимых отклонениях напряжения на основном вводе;',
              'возврат на основной ввод при восстановлении его параметров;',
              'защита электрооборудования от перегрузок и коротких замыканий;',
              'визуальный контроль состояния вводов и режимов работы;',
              'возможность ручного управления в аварийных ситуациях.'
            ],
            workflow: [
              {
                title: 'Нормальный режим (основной ввод в норме)',
                text: 'Питание нагрузки идёт через основной ввод; контактор резервного ввода отключён; горит индикатор <strong>«Основной ввод»</strong>; реле контроля напряжения отслеживает параметры сети.'
              },
              {
                title: 'Аварийный режим (пропадание или сбой на основном вводе)',
                text: 'Реле контроля фиксирует отклонение параметров (падение напряжения, обрыв фазы); через заданную выдержку времени отключается контактор основного ввода; включается контактор резервного ввода; загорается индикатор <strong>«Резервный ввод»</strong>.'
              },
              {
                title: 'Возврат в нормальный режим (восстановление основного ввода)',
                text: 'После стабилизации напряжения на основном вводе реле даёт команду на переключение; с выдержкой времени отключается контактор резервного ввода; включается контактор основного ввода; восстанавливается индикация <strong>«Основной ввод»</strong>.'
              }
            ],
            features: [
              {
                name: 'Модульность',
                desc: '— Лёгкая адаптация под задачи, возможность модернизации'
              },
              {
                name: 'Надёжность',
                desc: '— Контакторы с ресурсом в десятки тысяч циклов, защита от одновременного включения вводов'
              },
              {
                name: 'Гибкость управления',
                desc: '— Автоматический/ручной режим, настраиваемые уставки, совместимость с диспетчеризацией'
              },
              {
                name: 'Наглядность',
                desc: '— Индикация состояния, приборы контроля, понятная схема'
              },
              {
                name: 'Экономичность',
                desc: '— Низкая стоимость при токах >100 А, доступные запчасти'
              },
              {
                name: 'Универсальность',
                desc: '— Работа с сетью, генераторами, ИБП; поддержка 1‑ и 3‑фазных нагрузок'
              },
              {
                name: 'Безопасность',
                desc: '— Защита от КЗ/перегрузок, заземление, предупредительная индикация'
              },
              {
                name: 'Масштабируемость',
                desc: '— Добавление линий, счётчиков, модулей телеуправления'
              },
              {
                name: 'Скорость переключения',
                desc: '— Переключение за 0,1–0,5 с'
              }
            ]
          };
        } else {
          // Моноблочный тип (по умолчанию)
          return {
            purpose: `Шкаф АВР (автоматического ввода резерва) на базе моноблочного устройства предназначен для бесперебойного электроснабжения потребителей. Он обеспечивает:`,
            purposeList: [
              'автоматический переход на резервный источник питания при пропадании или недопустимых отклонениях напряжения на основном вводе;',
              'возврат на основной ввод при восстановлении его параметров;',
              'защиту электрооборудования от перегрузок и коротких замыканий;',
              'визуальный контроль состояния вводов и режимов работы.'
            ],
            workflow: [
              {
                title: 'Нормальный режим (основной ввод в норме)',
                text: 'Питание нагрузки идёт через основной ввод; резервный ввод отключён; горит индикатор <strong>«Основной ввод»</strong>.'
              },
              {
                title: 'Аварийный режим (пропадание или сбой на основном вводе)',
                text: 'АВР фиксирует отклонение параметров (например, падение напряжения ниже уставки); через заданную выдержку времени отключает основной ввод; включает резервный ввод; загорается индикатор <strong>«Резервный ввод»</strong>.'
              },
              {
                title: 'Возврат в нормальный режим (восстановление основного ввода)',
                text: 'После стабилизации напряжения на основном вводе АВР с выдержкой времени переключает нагрузку обратно; отключает резервный ввод; восстанавливает индикацию <strong>«Основной ввод»</strong>.'
              }
            ],
            features: [
              {
                name: 'Моноблочное исполнение',
                desc: '— Компактность, простота монтажа и обслуживания'
              },
              {
                name: 'Встроенная логика контроля',
                desc: '— Не требует внешних реле и контроллеров'
              },
              {
                name: 'Настраиваемые уставки',
                desc: '— Гибкость под конкретные требования сети'
              },
              {
                name: 'Механическая блокировка',
                desc: '— Исключает одновременное включение вводов'
              },
              {
                name: 'Индикация и диагностика',
                desc: '— Удобство эксплуатации и поиска неисправностей'
              },
              {
                name: 'Совместимость',
                desc: '— Работает с генераторами, ИБП и сетевыми вводами'
              }
            ]
          };
        }
      }
    };
  });
});
