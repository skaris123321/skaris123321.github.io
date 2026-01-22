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
      const { manufacturer_brand, commutation_type, inputs_count, enclosure_type, connection_type, climate_type } = filters;

      let filtered = data.products;
      if (manufacturer_brand) filtered = filtered.filter(p => p.brand === manufacturer_brand);
      if (commutation_type) filtered = filtered.filter(p => p.commutation_type === commutation_type);
      if (inputs_count) filtered = filtered.filter(p => p.inputs_count === inputs_count);
      if (enclosure_type) filtered = filtered.filter(p => p.enclosure_type === enclosure_type);
      if (connection_type) filtered = filtered.filter(p => p.connection_type === connection_type);
      if (climate_type) filtered = filtered.filter(p => p.climate_type === climate_type);

      const opts = {
        manufacturer_brand: [...new Set(data.products.map(p => p.brand).filter(Boolean))].sort(),
        commutation_type: [],
        inputs_count: [],
        nominal_current: [],
        enclosure_type: [],
        connection_type: [],
        climate_type: []
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
      if (enclosure_type) currentProducts = currentProducts.filter(p => p.enclosure_type === enclosure_type);
      if (connection_type) currentProducts = currentProducts.filter(p => p.connection_type === connection_type);
      if (climate_type) currentProducts = currentProducts.filter(p => p.climate_type === climate_type);
      opts.nominal_current = [...new Set(currentProducts.map(p => parseInt(p.nominal_current)).filter(Boolean))].sort((a, b) => a - b);

      // Опции для однофазных АВР
      let singlePhaseProducts = data.products.filter(p => p.commutation_type === 'single_phase_contactors');
      if (manufacturer_brand) singlePhaseProducts = singlePhaseProducts.filter(p => p.brand === manufacturer_brand);
      if (inputs_count) singlePhaseProducts = singlePhaseProducts.filter(p => p.inputs_count === inputs_count);
      
      // Для enclosure_type не фильтруем по connection_type и climate_type
      let enclosureProducts = singlePhaseProducts;
      opts.enclosure_type = [...new Set(enclosureProducts.map(p => p.enclosure_type).filter(Boolean))].sort();
      
      // Для connection_type не фильтруем по enclosure_type и climate_type
      let connectionProducts = singlePhaseProducts;
      opts.connection_type = [...new Set(connectionProducts.map(p => p.connection_type).filter(Boolean))].sort();
      
      // Для climate_type фильтруем по enclosure_type (УХЛ4 только для 19")
      let climateProducts = singlePhaseProducts;
      if (enclosure_type) climateProducts = climateProducts.filter(p => p.enclosure_type === enclosure_type);
      opts.climate_type = [...new Set(climateProducts.map(p => p.climate_type).filter(Boolean))].sort();

      return { success: true, available_options: opts };
    }

    async getProduct(filters) {
      const data = await this.loadProducts();
      
      // Если передан ID, ищем по ID
      if (filters.id) {
        const product = data.products.find(p => p.id === parseInt(filters.id));
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
            enclosure_type: product.enclosure_type || null,
            connection_type: product.connection_type || null,
            climate_type: product.climate_type || null,
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
      
      // Иначе ищем по фильтрам (старая логика)
      const { nominal_current, commutation_type, manufacturer_brand, inputs_count, enclosure_type, connection_type, climate_type } = filters;

      if (!nominal_current) throw new Error('nominal_current required');

      const product = data.products.find(p => {
        if (parseInt(p.nominal_current) !== parseInt(nominal_current)) return false;
        if (commutation_type && p.commutation_type !== commutation_type) return false;
        if (manufacturer_brand && p.brand !== manufacturer_brand) return false;
        if (inputs_count && p.inputs_count !== inputs_count) return false;
        if (enclosure_type && p.enclosure_type !== enclosure_type) return false;
        if (connection_type && p.connection_type !== connection_type) return false;
        if (climate_type && p.climate_type !== climate_type) return false;
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
          enclosure_type: product.enclosure_type || null,
          connection_type: product.connection_type || null,
          climate_type: product.climate_type || null,
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
      // Новые параметры для однофазных АВР
      enclosureType: '19inch', // '19inch' или 'wall'
      connectionType: 'poles', // 'poles' или 'terminals'
      climateType: 'UHL4', // 'UHL4' или 'U2'
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
        inputs_count: [],
        enclosure_type: [],
        connection_type: [],
        climate_type: []
      },
      cartQuantity: 0, // Количество этого товара в корзине
      
      
      async init() {
        // Проверяем URL параметры
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (productId) {
          // Если есть ID в URL, загружаем товар по ID
          await this.loadProductById(productId);
        } else {
          // Иначе используем старую логику с параметрами по умолчанию
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
          
          await this.loadProduct();
        }
        
        // Устанавливаем подключение кабеля в зависимости от тока для трехфазных АВР
        if (this.commutationType !== 'single_phase_contactors') {
          const current = parseInt(this.nominalCurrent);
          if (current >= 100 && current <= 800) {
            this.cableConnection = 'terminals';
          }
        }
        
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
          if (this.enclosureType) filters.enclosure_type = this.enclosureType;
          if (this.connectionType) filters.connection_type = this.connectionType;
          if (this.climateType) filters.climate_type = this.climateType;

          const data = await productsAPI.getAvailableOptions(filters);
          
          if (data.success && data.available_options) {
            this.availableOptions = {
              nominal_current: data.available_options.nominal_current || [],
              commutation_type: data.available_options.commutation_type || [],
              manufacturer_brand: data.available_options.manufacturer_brand || [],
              inputs_count: data.available_options.inputs_count || [],
              enclosure_type: data.available_options.enclosure_type || [],
              connection_type: data.available_options.connection_type || [],
              climate_type: data.available_options.climate_type || []
            };
            console.log('Доступные опции загружены:', this.availableOptions);
          } else {
            this.availableOptions = {
              nominal_current: [],
              commutation_type: [],
              manufacturer_brand: [],
              inputs_count: [],
              enclosure_type: [],
              connection_type: [],
              climate_type: []
            };
          }
        } catch (error) {
          console.error('Ошибка при загрузке доступных опций:', error);
          this.availableOptions = {
            nominal_current: [],
            commutation_type: [],
            manufacturer_brand: [],
            inputs_count: [],
            enclosure_type: [],
            connection_type: [],
            climate_type: []
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
          
          // Добавляем фильтры для однофазных АВР
          if (this.commutationType === 'single_phase_contactors') {
            filters.enclosure_type = this.enclosureType;
            filters.connection_type = this.connectionType;
            filters.climate_type = this.climateType;
          }

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
            this.documentation = product.documentation || [];
            
            this.nominalCurrent = String(product.nominal_current);
            this.commutationType = product.commutation_type;
            this.manufacturerBrand = product.manufacturer_brand;
            this.inputsCount = product.inputs_count;
            
            const current = parseInt(product.nominal_current);
            if (current >= 100 && current <= 800) {
              this.cableConnection = 'terminals';
            }
            
            // Сбрасываем индекс изображения
            this.currentIndex = 0;
            this.thumbnailScroll = 0;
            
            // Перезагружаем доступные опции после загрузки товара для актуализации доступных значений
            await this.loadAvailableOptions();
            
            // Загружаем документы для текущего продукта
            if (window.documentsManager) {
              const productData = {
                name: this.productTitle,
                manufacturer: this.manufacturerBrand,
                current: parseInt(this.nominalCurrent),
                inputs: parseInt(this.inputsCount),
                commutation_type: this.commutationType
              };
              await window.documentsManager.loadDocuments(productData);
            }
            
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
      
      // Новый метод для загрузки товара по ID
      async loadProductById(productId) {
        this.loading = true;
        
        try {
          if (!productsAPI) {
            throw new Error('ProductsAPI не инициализирован');
          }

          const data = await productsAPI.getProduct({ id: productId });
          
          if (data.success && data.product) {
            const product = data.product;
            
            // Устанавливаем параметры товара
            this.manufacturerBrand = product.manufacturer_brand;
            this.commutationType = product.commutation_type;
            this.nominalCurrent = String(product.nominal_current);
            this.inputsCount = product.inputs_count;
            
            // Устанавливаем параметры для однофазных АВР
            if (product.commutation_type === 'single_phase_contactors') {
              this.enclosureType = product.enclosure_type || '19inch';
              this.connectionType = product.connection_type || 'poles';
              this.climateType = product.climate_type || 'UHL4';
            }
            
            // Обновляем данные товара
            this.basePrice = product.base_price;
            this.article = product.article;
            
            // Формируем массив изображений
            const imageList = product.images && product.images.length > 0 
              ? product.images 
              : (product.main_image ? [product.main_image] : []);
            
            this.images = imageList.map(img => {
              return img.startsWith('images/') ? '../' + img : img;
            });
            
            this.productSpecs = product.specs || {};
            this.fullDescription = product.full_description || product.description || '';
            this.documentation = product.documentation || [];
            
            const current = parseInt(product.nominal_current);
            if (product.commutation_type !== 'single_phase_contactors') {
              if (current >= 100 && current <= 800) {
                this.cableConnection = 'terminals';
              } else {
                this.cableConnection = 'poles';
              }
            }
            
            // Сбрасываем индекс изображения
            this.currentIndex = 0;
            this.thumbnailScroll = 0;
            
            // Загружаем доступные опции для этого товара ПОСЛЕ установки всех параметров
            await this.loadAvailableOptions();
            
            console.log('Товар загружен по ID:', product.id, product.article);
          } else {
            console.error('Ошибка загрузки товара по ID:', data.message);
          }
        } catch (error) {
          console.error('Ошибка при загрузке товара по ID:', error);
        } finally {
          this.loading = false;
        }
      },
      
      // Новый метод для загрузки товара по характеристикам (без смены URL)
      async loadProductByCharacteristics() {
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
          
          // Добавляем фильтры для однофазных АВР
          if (this.commutationType === 'single_phase_contactors') {
            filters.enclosure_type = this.enclosureType;
            filters.connection_type = this.connectionType;
            filters.climate_type = this.climateType;
          }

          const data = await productsAPI.getProduct(filters);
          
          if (data.success && data.product) {
            const product = data.product;
            
            // Обновляем данные товара, но НЕ меняем характеристики
            this.basePrice = product.base_price;
            this.article = product.article;
            
            // Формируем массив изображений
            const imageList = product.images && product.images.length > 0 
              ? product.images 
              : (product.main_image ? [product.main_image] : []);
            
            this.images = imageList.map(img => {
              return img.startsWith('images/') ? '../' + img : img;
            });
            
            this.productSpecs = product.specs || {};
            this.fullDescription = product.full_description || product.description || '';
            this.documentation = product.documentation || [];
            
            const current = parseInt(product.nominal_current);
            if (current >= 100 && current <= 800) {
              this.cableConnection = 'terminals';
            }
            
            // Сбрасываем индекс изображения
            this.currentIndex = 0;
            this.thumbnailScroll = 0;
            
            console.log('Товар загружен по характеристикам:', product);
          } else {
            console.error('Ошибка загрузки товара по характеристикам:', data.message);
          }
        } catch (error) {
          console.error('Ошибка при загрузке товара по характеристикам:', error);
        } finally {
          this.loading = false;
        }
      },
      
      // Метод для обновления номинального тока
      async updateNominalCurrent(value) {
        if (this.loading || !this.isOptionAvailable('nominal_current', value)) return;
        this.nominalCurrent = value;
        
        const current = parseInt(value);
        if (current >= 100 && current <= 800) {
          this.cableConnection = 'terminals';
        }
        
        await this.loadProductByCharacteristics();
        this.updateCartQuantity();
      },
      
      // Метод для обновления типа коммутации
      async updateCommutationType(value) {
        if (this.loading || !this.isOptionAvailable('commutation_type', value)) return;
        this.loading = true;
        this.commutationType = value;
        
        try {
          if (value === 'contactors') {
            this.inputsCount = '2';
          }
          
          // Если переключаемся на однофазные АВР, устанавливаем доступные значения по умолчанию
          if (value === 'single_phase_contactors') {
            this.inputsCount = '2'; // Однофазные всегда 2 ввода
          }
          
          await this.loadAvailableOptions();
          
          // Для однофазных АВР устанавливаем первые доступные значения
          if (value === 'single_phase_contactors') {
            // Устанавливаем первый доступный тип корпуса
            if (this.availableOptions.enclosure_type && this.availableOptions.enclosure_type.length > 0) {
              if (!this.availableOptions.enclosure_type.includes(this.enclosureType)) {
                this.enclosureType = this.availableOptions.enclosure_type[0];
              }
            }
            
            // Устанавливаем первый доступный тип подключения
            if (this.availableOptions.connection_type && this.availableOptions.connection_type.length > 0) {
              if (!this.availableOptions.connection_type.includes(this.connectionType)) {
                this.connectionType = this.availableOptions.connection_type[0];
              }
            }
            
            // Устанавливаем первый доступный тип климата
            if (this.availableOptions.climate_type && this.availableOptions.climate_type.length > 0) {
              if (!this.availableOptions.climate_type.includes(this.climateType)) {
                this.climateType = this.availableOptions.climate_type[0];
              }
            }
            
            // Перезагружаем опции с учетом новых параметров
            await this.loadAvailableOptions();
          }
          
          // Если тип не контакторы, выбираем первое доступное количество вводов
          if (value !== 'contactors' && value !== 'single_phase_contactors' && this.availableOptions.inputs_count && this.availableOptions.inputs_count.length > 0) {
            if (!this.availableOptions.inputs_count.includes(this.inputsCount)) {
              this.inputsCount = this.availableOptions.inputs_count[0];
            }
            await this.loadAvailableOptions();
          }
          
          // Выбираем первый доступный номинальный ток
          if (this.availableOptions.nominal_current && this.availableOptions.nominal_current.length > 0) {
            this.nominalCurrent = String(this.availableOptions.nominal_current[0]);
          }
          
          await this.loadProductByCharacteristics();
          this.updateCartQuantity();
        } finally {
          this.loading = false;
        }
      },
      
      // Метод для обновления бренда
      async updateManufacturerBrand(value) {
        if (this.loading) return;
        this.loading = true;
        this.manufacturerBrand = value;
        
        try {
          await this.loadAvailableOptions();
          
          // Выбираем первый доступный тип коммутации
          if (this.availableOptions.commutation_type && this.availableOptions.commutation_type.length > 0) {
            this.commutationType = this.availableOptions.commutation_type[0];
            await this.loadAvailableOptions();
          }
          
          // Выбираем первое доступное количество вводов
          if (this.availableOptions.inputs_count && this.availableOptions.inputs_count.length > 0) {
            this.inputsCount = this.availableOptions.inputs_count[0];
            await this.loadAvailableOptions();
          }
          
          // Если это однофазные АВР, устанавливаем доступные параметры
          if (this.commutationType === 'single_phase_contactors') {
            // Устанавливаем первый доступный тип корпуса
            if (this.availableOptions.enclosure_type && this.availableOptions.enclosure_type.length > 0) {
              this.enclosureType = this.availableOptions.enclosure_type[0];
            }
            
            // Устанавливаем первый доступный тип подключения
            if (this.availableOptions.connection_type && this.availableOptions.connection_type.length > 0) {
              this.connectionType = this.availableOptions.connection_type[0];
            }
            
            // Устанавливаем первый доступный тип климата
            if (this.availableOptions.climate_type && this.availableOptions.climate_type.length > 0) {
              this.climateType = this.availableOptions.climate_type[0];
            }
            
            // Перезагружаем опции с учетом новых параметров
            await this.loadAvailableOptions();
          }
          
          // Выбираем первый доступный номинальный ток
          if (this.availableOptions.nominal_current && this.availableOptions.nominal_current.length > 0) {
            this.nominalCurrent = String(this.availableOptions.nominal_current[0]);
          }
          
          await this.loadProductByCharacteristics();
          this.updateCartQuantity();
        } finally {
          this.loading = false;
        }
      },
      
      // Метод для обновления количества вводов
      async updateInputsCount(value) {
        if (this.commutationType === 'contactors' && value === '3') {
          return;
        }
        
        if (this.loading || !this.isOptionAvailable('inputs_count', value)) return;
        this.loading = true;
        this.inputsCount = value;
        
        try {
          await this.loadAvailableOptions();
          
          // Выбираем первый доступный номинальный ток
          if (!this.isOptionAvailable('nominal_current', this.nominalCurrent)) {
            if (this.availableOptions.nominal_current && this.availableOptions.nominal_current.length > 0) {
              this.nominalCurrent = String(this.availableOptions.nominal_current[0]);
            }
          }
          
          await this.loadProductByCharacteristics();
          this.updateCartQuantity();
        } finally {
          this.loading = false;
        }
      },
      
      // Итоговая цена = базовая цена + дополнительные опции
      get totalPrice() {
        let price = this.basePrice;
        
        if (this.commutationType === 'single_phase_contactors') {
          // Для однофазных АВР
          if (this.connectionType === 'terminals') {
            price += 1000;
          }
          if (this.climateType === 'U2') {
            price += 23000;
          }
        } else {
          // Для трехфазных АВР
          if (this.cableConnection === 'terminals' && this.shouldChargeForTerminals) {
            price += 1000;
          }
          if (this.climateVersion === 'U2') {
            price += 23000;
          }
        }
        
        return price;
      },

      get shouldChargeForTerminals() {
        const current = parseInt(this.nominalCurrent);
        return current >= 25 && current <= 80;
      },

      get isPolesToAvailable() {
        const current = parseInt(this.nominalCurrent);
        return current >= 25 && current <= 80;
      },

      updateCableConnection(value) {
        if (value === 'poles' && !this.isPolesToAvailable) {
          return;
        }
        
        this.cableConnection = value;
        this.updateCartQuantity();
      },

      updateClimateVersion(value) {
        this.climateVersion = value;
        this.updateCartQuantity();
      },
      
      // Новые методы для однофазных АВР
      async updateEnclosureType(value) {
        if (this.loading || !this.isOptionAvailable('enclosure_type', value)) return;
        this.loading = true;
        this.enclosureType = value;
        
        try {
          await this.loadAvailableOptions();
          
          // Если выбран навесной корпус, сбрасываем климатическое исполнение на У2
          if (value === 'wall') {
            this.climateType = 'U2';
          } else if (value === '19inch') {
            // Для 19" доступны оба варианта, выбираем первый доступный
            if (this.availableOptions.climate_type && this.availableOptions.climate_type.length > 0) {
              if (!this.availableOptions.climate_type.includes(this.climateType)) {
                this.climateType = this.availableOptions.climate_type[0];
              }
            }
          }
          
          await this.loadProductByCharacteristics();
          this.updateCartQuantity();
        } finally {
          this.loading = false;
        }
      },
      
      async updateConnectionType(value) {
        if (this.loading || !this.isOptionAvailable('connection_type', value)) return;
        this.connectionType = value;
        await this.loadProductByCharacteristics();
        this.updateCartQuantity();
      },
      
      async updateClimateType(value) {
        if (this.loading || !this.isOptionAvailable('climate_type', value)) return;
        this.climateType = value;
        await this.loadProductByCharacteristics();
        this.updateCartQuantity();
      },
      
      get productTitle() {
        return `АВР ${this.nominalCurrent || '100'}А на ${this.inputsCount || '2'} ввода`;
      },
      
      get allSelectedSpecs() {
        const specs = this.productSpecs ? { ...this.productSpecs } : {};
        
        if (this.commutationType === 'single_phase_contactors') {
          // Для однофазных АВР
          specs['Артикул'] = this.article || '';
          specs['Производитель'] = this.manufacturerBrand || '';
          specs['Количество вводов'] = `${this.inputsCount}`;
          specs['Тип коммутации'] = 'Контакторы';
          specs['Корпус'] = this.enclosureType === '19inch' ? '19 дюймов' : 'Навесной';
          specs['Подключение кабеля'] = this.connectionType === 'poles' ? 'К полюсам автомата' : 'На дополнительные клеммы';
          specs['Климатическое исполнение'] = this.climateType === 'UHL4' ? 'УХЛ4 - сухие теплые помещения' : 'У2 - уличное с обогревом';
        } else {
          // Для трехфазных АВР
          // Генерируем новый артикул по формуле АВР-[ВВОДЫ]-[ТОК]-[К/М]-РОСЭК
          const typeCode = this.commutationType === 'contactors' ? 'К' : 'М';
          const newArticle = `АВР-${this.inputsCount}-${this.nominalCurrent}-${typeCode}-РОСЭК`;
          
          specs['Артикул'] = newArticle;
          specs['Производитель'] = this.manufacturerBrand || '';
          specs['Количество вводов'] = `${this.inputsCount}`;
          specs['Тип коммутации'] = this.commutationType === 'monoblock' ? 'Моноблочный АВР' : 'Контакторы';
          specs['Подключение кабеля'] = this.cableConnection === 'poles' ? 'К полюсам автомата' : 'На дополнительные клеммы';
          specs['Климатическое исполнение'] = this.climateVersion === 'UXL4' ? 'УХЛ4 - сухие теплые помещения' : 'У2 - уличное с обогревом';
        }
        
        return specs;
      },

      // Генерируем новый артикул по формуле
      get dynamicArticle() {
        const typeCode = this.commutationType === 'contactors' ? 'К' : 'М';
        return `АВР-${this.inputsCount}-${this.nominalCurrent}-${typeCode}-РОСЭК`;
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

      initCart() {
        this.updateCartQuantity();
        
        window.addEventListener('cartChanged', () => {
          this.updateCartQuantity();
        });
      },

      updateCartQuantity() {
        if (window.cart) {
          const currentProduct = this.getCurrentProduct();
          this.cartQuantity = window.cart.hasItem(currentProduct);
        }
      },

      getCurrentProduct() {
        if (this.commutationType === 'single_phase_contactors') {
          // Для однофазных АВР
          return {
            article: this.article,
            manufacturerBrand: this.manufacturerBrand,
            commutationType: this.commutationType,
            nominalCurrent: this.nominalCurrent,
            inputsCount: this.inputsCount,
            enclosureType: this.enclosureType,
            connectionType: this.connectionType,
            climateType: this.climateType,
            basePrice: this.basePrice,
            totalPrice: this.totalPrice,
            images: this.images,
            productSpecs: this.productSpecs,
            productTitle: this.productTitle
          };
        } else {
          // Для трехфазных АВР
          // Генерируем новый артикул по формуле АВР-[ВВОДЫ]-[ТОК]-[К/М]-РОСЭК
          const typeCode = this.commutationType === 'contactors' ? 'К' : 'М';
          const newArticle = `АВР-${this.inputsCount}-${this.nominalCurrent}-${typeCode}-РОСЭК`;
          
          return {
            article: newArticle,
            manufacturerBrand: this.manufacturerBrand,
            commutationType: this.commutationType,
            nominalCurrent: this.nominalCurrent,
            inputsCount: this.inputsCount,
            cableConnection: this.cableConnection,
            climateVersion: this.climateVersion,
            basePrice: this.basePrice,
            totalPrice: this.totalPrice,
            images: this.images,
            productSpecs: this.productSpecs,
            productTitle: this.productTitle
          };
        }
      },

      addToCart() {
        if (window.cart) {
          const currentProduct = this.getCurrentProduct();
          const oldQuantity = window.cart.hasItem(currentProduct);
          
          window.cart.addItem(currentProduct, 1);
          
          const newQuantity = window.cart.hasItem(currentProduct);
          this.showCartNotification(newQuantity, oldQuantity);
        }
      },

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

      // Форматирование размера файла
      formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      },

      // Предварительный просмотр документа
      previewDocument(url) {
        // Открываем PDF в новой вкладке
        window.open(url, '_blank');
      },

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
        if (this.commutationType === 'single_phase_contactors') {
          return {
            purpose: `АВР (автоматический ввод резерва) на базе контакторов предназначен для обеспечения бесперебойного электроснабжения потребителей путём автоматического переключения между основным и резервным вводами. Основные функции:`,
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
                name: 'Компактность',
                desc: '— Малые габариты для небольших нагрузок'
              },
              {
                name: 'Надёжность',
                desc: '— Контакторы с высоким ресурсом, защита от одновременного включения вводов'
              },
              {
                name: 'Простота монтажа',
                desc: '— 19" и навесное исполнение для различных условий установки'
              },
              {
                name: 'Экономичность',
                desc: '— Оптимальное решение для небольших нагрузок'
              },
              {
                name: 'Универсальность',
                desc: '— Работа с сетью, генераторами, ИБП'
              },
              {
                name: 'Климатическое исполнение',
                desc: '— УХЛ4 для помещений, У2 для уличной установки'
              },
              {
                name: 'Скорость переключения',
                desc: '— Переключение за 0,1–0,5 с'
              }
            ]
          };
        } else if (this.commutationType === 'contactors') {
          return {
            purpose: `АВР (автоматический ввод резерва) на базе контакторов предназначен для обеспечения бесперебойного электроснабжения потребителей путём автоматического переключения между основным и резервным вводами. Основные функции:`,
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
            purpose: `АВР (автоматический ввод резерва) на базе моноблочного устройства предназначен для бесперебойного электроснабжения потребителей. Он обеспечивает:`,
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
