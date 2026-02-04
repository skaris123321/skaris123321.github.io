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
      const { manufacturer_brand, commutation_type, inputs_count, control_type, motor_power, enclosure_type, connection_type, climate_type } = filters;

      let filtered = data.products;
      if (manufacturer_brand) filtered = filtered.filter(p => p.brand === manufacturer_brand);
      if (commutation_type) filtered = filtered.filter(p => p.commutation_type === commutation_type);
      if (inputs_count) filtered = filtered.filter(p => p.inputs_count === inputs_count);
      if (control_type) filtered = filtered.filter(p => p.control_type === control_type);
      if (motor_power) filtered = filtered.filter(p => parseFloat(p.motor_power) === parseFloat(motor_power));
      if (enclosure_type) filtered = filtered.filter(p => p.enclosure_type === enclosure_type);
      if (connection_type) filtered = filtered.filter(p => p.connection_type === connection_type);
      if (climate_type) filtered = filtered.filter(p => p.climate_type === climate_type);

      const opts = {
        manufacturer_brand: [...new Set(data.products.map(p => p.brand).filter(Boolean))].sort(),
        commutation_type: [],
        inputs_count: [],
        nominal_current: [],
        control_type: [],
        motor_power: [],
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

      // Для шкафов управления добавляем опции control_type и motor_power
      if (commutation_type === 'control_cabinet') {
        let controlTypeProducts = data.products;
        if (manufacturer_brand) controlTypeProducts = controlTypeProducts.filter(p => p.brand === manufacturer_brand);
        if (commutation_type) controlTypeProducts = controlTypeProducts.filter(p => p.commutation_type === commutation_type);
        opts.control_type = [...new Set(controlTypeProducts.map(p => p.control_type).filter(Boolean))].sort();

        let motorPowerProducts = data.products;
        if (manufacturer_brand) motorPowerProducts = motorPowerProducts.filter(p => p.brand === manufacturer_brand);
        if (commutation_type) motorPowerProducts = motorPowerProducts.filter(p => p.commutation_type === commutation_type);
        if (control_type) motorPowerProducts = motorPowerProducts.filter(p => p.control_type === control_type);
        opts.motor_power = [...new Set(motorPowerProducts.map(p => parseFloat(p.motor_power)).filter(Boolean))].sort((a, b) => a - b);
      } else {
        // Для АВР добавляем nominal_current
        let currentProducts = data.products;
        if (manufacturer_brand) currentProducts = currentProducts.filter(p => p.brand === manufacturer_brand);
        if (commutation_type) currentProducts = currentProducts.filter(p => p.commutation_type === commutation_type);
        if (inputs_count) currentProducts = currentProducts.filter(p => p.inputs_count === inputs_count);
        if (enclosure_type) currentProducts = currentProducts.filter(p => p.enclosure_type === enclosure_type);
        if (connection_type) currentProducts = currentProducts.filter(p => p.connection_type === connection_type);
        if (climate_type) currentProducts = currentProducts.filter(p => p.climate_type === climate_type);
        opts.nominal_current = [...new Set(currentProducts.map(p => parseInt(p.nominal_current)).filter(Boolean))].sort((a, b) => a - b);
      }

      // Опции для контакторов - используем poles_count вместо inputs_count
      if (commutation_type === 'contactors') {
        // Для контакторов poles_count означает: single_phase = однофазные, three_phase = трёхфазные
        opts.poles_count = ['single_phase', 'three_phase'];
        opts.inputs_count = []; // Для контакторов inputs_count не используется
      } else {
        opts.poles_count = []; // Для не-контакторов poles_count не используется
      }

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
            nominal_current: parseInt(product.nominal_current || 0),
            commutation_type: product.commutation_type,
            manufacturer_brand: product.brand,
            inputs_count: product.inputs_count,
            poles_count: product.poles_count,
            control_type: product.control_type,
            motor_power: product.motor_power,
            enclosure_type: product.enclosure_type || null,
            connection_type: product.connection_type || null,
            climate_type: product.climate_type || null,
            base_price: parseInt(product.base_price || 0),
            main_image: product.main_image || (product.images?.[0] || null),
            images: product.images || (product.main_image ? [product.main_image] : []),
            description: product.description || '',
            full_description: product.full_description || product.description || '',
            documentation: product.documentation || [],
            specs: product.specs || {},
            options: product.options || []
          }
        };
      }
      
      // Иначе ищем по фильтрам
      const { nominal_current, commutation_type, manufacturer_brand, inputs_count, poles_count, control_type, motor_power, enclosure_type, connection_type, climate_type } = filters;

      // Для шкафов управления требуется motor_power вместо nominal_current
      if (commutation_type === 'control_cabinet' && !motor_power) {
        throw new Error('motor_power required for control cabinets');
      } else if (commutation_type !== 'control_cabinet' && !nominal_current) {
        throw new Error('nominal_current required');
      }

      const product = data.products.find(p => {
        if (commutation_type === 'control_cabinet') {
          // Для шкафов управления
          if (parseFloat(p.motor_power) !== parseFloat(motor_power)) return false;
          if (control_type && p.control_type !== control_type) return false;
        } else {
          // Для АВР
          if (parseInt(p.nominal_current) !== parseInt(nominal_current)) return false;
        }
        
        if (commutation_type && p.commutation_type !== commutation_type) return false;
        if (manufacturer_brand && p.brand !== manufacturer_brand) return false;
        if (inputs_count && p.inputs_count !== inputs_count) return false;
        if (poles_count && p.poles_count !== poles_count) return false;
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
          nominal_current: parseInt(product.nominal_current || 0),
          commutation_type: product.commutation_type,
          manufacturer_brand: product.brand,
          inputs_count: product.inputs_count,
          poles_count: product.poles_count,
          control_type: product.control_type,
          motor_power: product.motor_power,
          enclosure_type: product.enclosure_type || null,
          connection_type: product.connection_type || null,
          climate_type: product.climate_type || null,
          base_price: parseInt(product.base_price || 0),
          main_image: product.main_image || (product.images?.[0] || null),
          images: product.images || (product.main_image ? [product.main_image] : []),
          description: product.description || '',
          full_description: product.full_description || product.description || '',
          documentation: product.documentation || [],
          specs: product.specs || {},
          options: product.options || []
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
      polesCount: 'single_phase', // для контакторов: 'single_phase' или 'three_phase'
      cableConnection: 'poles', // 'poles' или 'terminals'
      climateVersion: 'UXL4', // 'UXL4' или 'U2'
      // Новые параметры для однофазных АВР
      enclosureType: '19inch', // '19inch' или 'wall'
      connectionType: 'poles', // 'poles' или 'terminals'
      climateType: 'UHL4', // 'UHL4' или 'U2'
      // Параметры для шкафов управления
      controlType: 'soft_start', // 'soft_start', 'frequency_converter', 'direct_start'
      motorPower: '7.5', // мощность двигателя для шкафов управления
      basePrice: 87900,
      article: 'АВР-100-CHINT-2',
      loading: false,
      productSpecs: {},
      productOptions: [], // Опции товара из базы данных
      fullDescription: '',
      documentation: [],
      activeTab: 'specs',
      availableOptions: {
        nominal_current: [],
        commutation_type: [],
        manufacturer_brand: [],
        inputs_count: [],
        poles_count: [],
        enclosure_type: [],
        connection_type: [],
        climate_type: []
      },
      cartQuantity: 0, // Количество этого товара в корзине
      
      
      async init() {
        // Проверяем URL параметры
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        // Проверяем параметры для шкафов управления
        const commutationType = urlParams.get('commutationType');
        const motorPower = urlParams.get('motorPower');
        const controlType = urlParams.get('controlType');
        const manufacturerBrand = urlParams.get('manufacturerBrand');
        
        if (productId) {
          // Если есть ID в URL, загружаем товар по ID
          await this.loadProductById(productId);
        } else if (commutationType && motorPower && controlType && manufacturerBrand) {
          // Если есть параметры для шкафов управления, устанавливаем их
          this.commutationType = commutationType;
          this.motorPower = motorPower;
          this.controlType = controlType;
          this.manufacturerBrand = manufacturerBrand;
          
          await this.loadAvailableOptions();
          await this.loadProduct();
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
          
          if (this.commutationType === 'control_cabinet') {
            // Для шкафов управления проверяем control_type и motor_power
            if (!this.isOptionAvailable('control_type', this.controlType)) {
              if (this.availableOptions.control_type?.[0]) {
                this.controlType = this.availableOptions.control_type[0];
                await this.loadAvailableOptions();
              }
            }
            
            if (!this.isOptionAvailable('motor_power', this.motorPower)) {
              if (this.availableOptions.motor_power?.[0]) {
                this.motorPower = String(this.availableOptions.motor_power[0]);
              }
            }
          } else {
            // Для АВР проверяем inputs_count и nominal_current
            if (!this.isOptionAvailable('inputs_count', this.inputsCount)) {
              if (this.availableOptions.inputs_count?.[0]) {
                this.inputsCount = this.availableOptions.inputs_count[0];
                await this.loadAvailableOptions();
              }
            }
            
            if (!this.isOptionAvailable('nominal_current', this.nominalCurrent)) {
              if (this.availableOptions.nominal_current?.[0]) {
                this.nominalCurrent = String(this.availableOptions.nominal_current[0]);
              }
            }
          }
          
          await this.loadProduct();
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
          
          if (this.commutationType === 'control_cabinet') {
            // Для шкафов управления используем control_type и motor_power
            if (this.controlType) filters.control_type = this.controlType;
            if (this.motorPower) filters.motor_power = this.motorPower;
            filters.inputs_count = '1'; // Всегда 1 для шкафов управления
          } else {
            // Для АВР используем старые фильтры
            // Для контакторов используем poles_count, для остальных - inputs_count
            if (this.commutationType === 'contactors') {
              if (this.polesCount) filters.poles_count = this.polesCount;
            } else {
              if (this.inputsCount) filters.inputs_count = this.inputsCount;
            }
            
            if (this.enclosureType) filters.enclosure_type = this.enclosureType;
            if (this.connectionType) filters.connection_type = this.connectionType;
            if (this.climateType) filters.climate_type = this.climateType;
          }

          const data = await productsAPI.getAvailableOptions(filters);
          
          if (data.success && data.available_options) {
            this.availableOptions = {
              nominal_current: data.available_options.nominal_current || [],
              commutation_type: data.available_options.commutation_type || [],
              manufacturer_brand: data.available_options.manufacturer_brand || [],
              inputs_count: data.available_options.inputs_count || [],
              poles_count: data.available_options.poles_count || [],
              control_type: data.available_options.control_type || [],
              motor_power: data.available_options.motor_power || [],
              enclosure_type: data.available_options.enclosure_type || [],
              connection_type: data.available_options.connection_type || [],
              climate_type: data.available_options.climate_type || []
            };


          } else {
            this.availableOptions = {
              nominal_current: [],
              commutation_type: [],
              manufacturer_brand: [],
              inputs_count: [],
              poles_count: [],
              control_type: [],
              motor_power: [],
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
            poles_count: [],
            control_type: [],
            motor_power: [],
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
            commutation_type: this.commutationType
          };
          
          if (this.commutationType === 'control_cabinet') {
            // Для шкафов управления используем motor_power и control_type
            filters.motor_power = this.motorPower;
            filters.control_type = this.controlType;
            filters.inputs_count = '1'; // Всегда 1 для шкафов управления
          } else {
            // Для АВР используем nominal_current
            filters.nominal_current = this.nominalCurrent;
            
            // Для контакторов используем poles_count, для остальных - inputs_count
            if (this.commutationType === 'contactors') {
              filters.poles_count = this.polesCount;
            } else {
              filters.inputs_count = this.inputsCount;
            }
            
            // Добавляем фильтры для однофазных АВР
            if (false) {
              filters.enclosure_type = this.enclosureType;
              filters.connection_type = this.connectionType;
              filters.climate_type = this.climateType;
            }
          }

          const data = await productsAPI.getProduct(filters);
          
          if (data.success && data.product) {
            const product = data.product;
            
            // Обновляем данные товара
            this.basePrice = product.base_price;
            this.article = product.article;
            // Формируем массив изображений: main_image первым, затем дополнительные images
            let imageList = [];
            if (product.main_image) {
              imageList.push(product.main_image);
            }
            if (product.images && product.images.length > 0) {
              // Добавляем дополнительные изображения, исключая дубликаты
              product.images.forEach(img => {
                if (img && img !== product.main_image) {
                  imageList.push(img);
                }
              });
            }
            // Если нет изображений вообще, используем пустой массив
            if (imageList.length === 0) {
              imageList = [];
            }
            
            this.images = imageList.map(img => {
              // Если путь относительный, добавляем ../
              return img.startsWith('images/') ? '../' + img : img;
            });
            this.productSpecs = product.specs || {};
            console.log('Loaded product specs:', this.productSpecs); // Debug log
            console.log('All selected specs:', this.allSelectedSpecs); // Debug log
            this.productOptions = product.options || [];
            this.fullDescription = product.full_description || product.description || '';
            this.documentation = product.documentation || [];
            console.log('Loaded documentation:', this.documentation); // Debug log для документации
            
            if (this.commutationType === 'control_cabinet') {
              // Для шкафов управления устанавливаем параметры из продукта
              this.motorPower = String(product.motor_power);
              this.controlType = product.control_type;
              this.manufacturerBrand = product.manufacturer_brand;
            } else {
              // Для АВР устанавливаем параметры из продукта
              this.nominalCurrent = String(product.nominal_current);
              this.commutationType = product.commutation_type;
              this.manufacturerBrand = product.manufacturer_brand;
              this.inputsCount = product.inputs_count;
              
              const current = parseInt(product.nominal_current);
              if (current >= 100 && current <= 800) {
                this.cableConnection = 'terminals';
              }
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
                current: parseInt(this.nominalCurrent || 0),
                inputs: parseInt(this.inputsCount || 1),
                commutation_type: this.commutationType
              };
              await window.documentsManager.loadDocuments(productData);
            }
            

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
            
            if (product.commutation_type === 'control_cabinet') {
              // Для шкафов управления
              this.controlType = product.control_type || 'soft_start';
              this.motorPower = String(product.motor_power || '7.5');
            } else {
              // Для АВР
              this.nominalCurrent = String(product.nominal_current);
              this.inputsCount = product.inputs_count;
              this.polesCount = product.poles_count || (product.nominal_current <= 100 ? 'single_phase' : 'three_phase');
              
              // Устанавливаем параметры для однофазных АВР
              if (false) {
                this.enclosureType = product.enclosure_type || '19inch';
                this.connectionType = product.connection_type || 'poles';
                this.climateType = product.climate_type || 'UHL4';
              }
            }
            
            // Обновляем данные товара
            this.basePrice = product.base_price;
            this.article = product.article;
            
            // Формируем массив изображений: main_image первым, затем дополнительные images
            let imageList = [];
            if (product.main_image) {
              imageList.push(product.main_image);
            }
            if (product.images && product.images.length > 0) {
              // Добавляем дополнительные изображения, исключая дубликаты
              product.images.forEach(img => {
                if (img && img !== product.main_image) {
                  imageList.push(img);
                }
              });
            }
            // Если нет изображений вообще, используем пустой массив
            if (imageList.length === 0) {
              imageList = [];
            }
            
            this.images = imageList.map(img => {
              return img.startsWith('images/') ? '../' + img : img;
            });
            
            this.productSpecs = product.specs || {};
            this.productOptions = product.options || [];
            this.fullDescription = product.full_description || product.description || '';
            this.documentation = product.documentation || [];
            
            // Сбрасываем индекс изображения
            this.currentIndex = 0;
            this.thumbnailScroll = 0;
            
            // Загружаем доступные опции для этого товара ПОСЛЕ установки всех параметров
            await this.loadAvailableOptions();
            

          } else {
            console.error('Ошибка загрузки товара по ID:', data.message);
            // Если товар не найден по ID, загружаем товар по умолчанию
            await this.loadAvailableOptions();
            await this.loadProduct();
          }
        } catch (error) {
          console.error('Ошибка при загрузке товара по ID:', error);
          // При ошибке загружаем товар по умолчанию
          await this.loadAvailableOptions();
          await this.loadProduct();
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
            commutation_type: this.commutationType
          };
          
          // Для шкафов управления используем motor_power и control_type
          if (this.commutationType === 'control_cabinet') {
            filters.motor_power = this.motorPower;
            filters.control_type = this.controlType;
            filters.inputs_count = '1'; // Всегда 1 для шкафов управления
          } else {
            // Для АВР используем nominal_current
            filters.nominal_current = this.nominalCurrent;
            
            // Для контакторов используем poles_count, для остальных - inputs_count
            if (this.commutationType === 'contactors') {
              filters.poles_count = this.polesCount;
            } else {
              filters.inputs_count = this.inputsCount;
            }
            
            // Добавляем фильтры для однофазных АВР
            if (false) {
              filters.enclosure_type = this.enclosureType;
              filters.connection_type = this.connectionType;
              filters.climate_type = this.climateType;
            }
          }

          const data = await productsAPI.getProduct(filters);
          
          if (data.success && data.product) {
            const product = data.product;
            
            // Обновляем данные товара, но НЕ меняем характеристики
            this.basePrice = product.base_price;
            this.article = product.article;
            
            // Формируем массив изображений: main_image первым, затем дополнительные images
            let imageList = [];
            if (product.main_image) {
              imageList.push(product.main_image);
            }
            if (product.images && product.images.length > 0) {
              // Добавляем дополнительные изображения, исключая дубликаты
              product.images.forEach(img => {
                if (img && img !== product.main_image) {
                  imageList.push(img);
                }
              });
            }
            // Если нет изображений вообще, используем пустой массив
            if (imageList.length === 0) {
              imageList = [];
            }
            
            this.images = imageList.map(img => {
              return img.startsWith('images/') ? '../' + img : img;
            });
            
            this.productSpecs = product.specs || {};
            this.productOptions = product.options || [];
            this.fullDescription = product.full_description || product.description || '';
            this.documentation = product.documentation || [];
            
            // Сбрасываем индекс изображения
            this.currentIndex = 0;
            this.thumbnailScroll = 0;
            

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
            this.polesCount = 'single_phase'; // По умолчанию однофазные
          }
          
          await this.loadAvailableOptions();
          
          // Если тип не контакторы, выбираем первое доступное количество вводов
          if (value !== 'contactors' && this.availableOptions.inputs_count && this.availableOptions.inputs_count.length > 0) {
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
          
          // НЕ меняем тип коммутации при смене бренда!
          // Проверяем, доступен ли текущий тип коммутации для нового бренда
          if (!this.availableOptions.commutation_type || !this.availableOptions.commutation_type.includes(this.commutationType)) {
            // Только если текущий тип недоступен, выбираем первый доступный
            if (this.availableOptions.commutation_type && this.availableOptions.commutation_type.length > 0) {
              this.commutationType = this.availableOptions.commutation_type[0];
            }
          }
          
          await this.loadAvailableOptions();
          
          if (this.commutationType === 'control_cabinet') {
            // Для шкафов управления проверяем доступность текущих параметров
            if (!this.availableOptions.control_type || !this.availableOptions.control_type.includes(this.controlType)) {
              if (this.availableOptions.control_type && this.availableOptions.control_type.length > 0) {
                this.controlType = this.availableOptions.control_type[0];
              }
            }
            
            if (!this.availableOptions.motor_power || !this.availableOptions.motor_power.includes(parseFloat(this.motorPower))) {
              if (this.availableOptions.motor_power && this.availableOptions.motor_power.length > 0) {
                this.motorPower = String(this.availableOptions.motor_power[0]);
              }
            }
          } else {
            // Для АВР проверяем доступность текущих параметров
            if (!this.availableOptions.inputs_count || !this.availableOptions.inputs_count.includes(this.inputsCount)) {
              if (this.availableOptions.inputs_count && this.availableOptions.inputs_count.length > 0) {
                this.inputsCount = this.availableOptions.inputs_count[0];
              }
            }
            
            if (!this.availableOptions.nominal_current || !this.availableOptions.nominal_current.includes(parseInt(this.nominalCurrent))) {
              if (this.availableOptions.nominal_current && this.availableOptions.nominal_current.length > 0) {
                this.nominalCurrent = String(this.availableOptions.nominal_current[0]);
              }
            }
          }
          
          await this.loadProductByCharacteristics();
          this.updateCartQuantity();
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
        
        if (this.commutationType === 'contactors') {
          // Для контакторов всегда +1000₽ за дополнительные клеммы
          if (this.cableConnection === 'terminals') {
            price += 1000;
          }
          
          if (this.climateVersion === 'U2') {
            price += 23000;
          }
        } else {
          // Для моноблочных АВР используем старую логику
          if (false) {
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
        }
        
        return price;
      },

      get shouldChargeForTerminals() {
        // Для контакторов всегда показываем +1000₽ за дополнительные клеммы
        if (this.commutationType === 'contactors') {
          return true;
        }
        
        // Для моноблочных АВР используем старую логику
        const current = parseInt(this.nominalCurrent);
        return current >= 25 && current <= 80;
      },

      get isPolesToAvailable() {
        // Для контакторов всегда доступно подключение к полюсам
        if (this.commutationType === 'contactors') {
          return true;
        }
        
        // Для моноблочных АВР используем старую логику
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
        if (this.commutationType === 'control_cabinet') {
          // Для шкафов управления: "Шкаф управления с плавным пуском 7.5 кВт"
          const controlTypeNames = {
            'soft_start': 'с плавным пуском',
            'frequency_converter': 'с преобразователем частоты',
            'direct_start': 'с прямым пуском'
          };
          const controlTypeName = controlTypeNames[this.controlType] || 'с плавным пуском';
          return `Шкаф управления ${controlTypeName} ${this.motorPower || '7.5'} кВт`;
        } else if (this.commutationType === 'contactors') {
          // Для контакторов: "Шкаф АВР 25А однофазный" или "Шкаф АВР 25А трёхфазный"
          const phaseType = (this.polesCount || (parseInt(this.nominalCurrent) <= 100 ? 'single_phase' : 'three_phase')) === 'single_phase' ? 'однофазный' : 'трёхфазный';
          return `Шкаф АВР ${this.nominalCurrent || '100'}А ${phaseType}`;
        } else {
          // Для моноблочных АВР: "Шкаф АВР 100А на 2 ввода"
          return `Шкаф АВР ${this.nominalCurrent || '100'}А на ${this.inputsCount || '2'} ввода`;
        }
      },
      
      // Методы для хлебных крошек
      getControlTypeDisplayName() {
        const controlTypeNames = {
          'soft_start': 'Плавный пуск',
          'frequency_converter': 'Преобразователь частоты',
          'direct_start': 'Прямой пуск'
        };
        return controlTypeNames[this.controlType] || 'Плавный пуск';
      },
      
      getAvrTypeDisplayName() {
        if (this.commutationType === 'contactors') {
          const phaseType = (this.polesCount || (parseInt(this.nominalCurrent) <= 100 ? 'single_phase' : 'three_phase')) === 'single_phase' ? 'Однофазные' : 'Трёхфазные';
          return `Контакторы ${phaseType}`;
        } else {
          return `Моноблочный АВР на ${this.inputsCount || '2'} ввода`;
        }
      },
      
      // Функция для перевода английских ключей в русские (если они попали в данные)
      translateSpecKey(key) {
        const translations = {
          'Voltage': 'Номинальное рабочее напряжение',
          'Gabarity': 'Габариты', 
          'IP': 'Степень защиты корпуса',
          'Nominal_current': 'Номинальный ток',
          'Dimensions': 'Габариты',
          'Protection_class': 'Степень защиты корпуса',
          'Working_voltage': 'Номинальное рабочее напряжение',
          'Current': 'Номинальный ток',
          'Size': 'Габариты',
          'Protection': 'Степень защиты корпуса',
          'Rated_current': 'Номинальный ток',
          'Rated_voltage': 'Номинальное рабочее напряжение',
          'Enclosure_protection': 'Степень защиты корпуса',
          // Дополнительные варианты
          'voltage': 'Номинальное рабочее напряжение',
          'gabarity': 'Габариты',
          'ip': 'Степень защиты корпуса',
          'nominal_current': 'Номинальный ток',
          'dimensions': 'Габариты',
          'current': 'Номинальный ток'
        };
        return translations[key] || key;
      },

      // Функция для нормализации значений спецификаций
      normalizeSpecValue(key, value) {
        // Если значение уже содержит единицы измерения, возвращаем как есть
        if (typeof value !== 'string') return String(value);
        
        // Нормализуем значения для разных типов характеристик
        if (key.includes('ток') || key.includes('current') || key.includes('Current')) {
          if (!value.includes('А') && !value.includes('A')) {
            return value + 'А';
          }
        }
        
        if (key.includes('напряжение') || key.includes('voltage') || key.includes('Voltage')) {
          if (!value.includes('В') && !value.includes('V')) {
            return value + ' В';
          }
        }
        
        if (key.includes('Габариты') || key.includes('габариты') || key.includes('Dimensions') || key.includes('Size')) {
          if (!value.includes('мм') && !value.includes('mm')) {
            return value + ' мм';
          }
        }
        
        return value;
      },

      get allSelectedSpecs() {
        const rawSpecs = this.productSpecs ? { ...this.productSpecs } : {};
        const specs = {};
        
        // Если это контактор и у него нет specs или specs пустая, добавляем дефолтные характеристики
        if (this.commutationType === 'contactors' && Object.keys(rawSpecs).length === 0) {
          // Дефолтные характеристики для контакторов
          rawSpecs['Габариты'] = '600х500х250 мм';
          rawSpecs['Номинальный ток'] = this.nominalCurrent + 'А';
          rawSpecs['Степень защиты корпуса'] = 'IP31';
        }
        
        // Переводим ключи, если они на английском, и нормализуем значения
        for (const [key, value] of Object.entries(rawSpecs)) {
          const translatedKey = this.translateSpecKey(key);
          const normalizedValue = this.normalizeSpecValue(translatedKey, value);
          
          // Для контакторов исключаем поле с напряжением
          if (this.commutationType === 'contactors' && 
              (translatedKey === 'Номинальное рабочее напряжение' || 
               translatedKey === 'Voltage' || 
               key === 'Номинальное рабочее напряжение' ||
               key === 'Voltage' ||
               key === 'voltage')) {
            continue; // Пропускаем это поле для контакторов
          }
          
          specs[translatedKey] = normalizedValue;
        }
        
        if (this.commutationType === 'control_cabinet') {
          // Для шкафов управления
          specs['Артикул'] = this.dynamicArticle;
          specs['Производитель'] = this.manufacturerBrand || '';
          specs['Количество вводов'] = '1';
          specs['Мощность двигателя'] = this.motorPower + ' кВт';
          specs['Количество фаз'] = '3';
          specs['Степень защиты'] = 'IP31';
        } else if (this.commutationType === 'contactors') {
          // Для контакторов
          const typeCode = 'К';
          const actualPolesCount = this.polesCount || (parseInt(this.nominalCurrent) <= 100 ? 'single_phase' : 'three_phase');
          const phaseCode = actualPolesCount === 'single_phase' ? '1Ф' : '3Ф';
          const newArticle = `АВР-${this.nominalCurrent}-${typeCode}-${phaseCode}-РОСЭК`;
          
          specs['Артикул'] = newArticle;
          specs['Производитель'] = this.manufacturerBrand || '';
          specs['Тип коммутации'] = 'Контакторы';
          specs['Количество полюсов'] = actualPolesCount === 'single_phase' ? 'Однофазные' : 'Трёхфазные';
          specs['Подключение кабеля'] = this.cableConnection === 'poles' ? 'К полюсам автомата' : 'На дополнительные клеммы';
          specs['Климатическое исполнение'] = this.climateVersion === 'UXL4' ? 'УХЛ4 - сухие теплые помещения' : 'У2 - уличное с обогревом';
        } else {
          // Для моноблочных АВР
          const typeCode = 'М';
          const newArticle = `АВР-${this.inputsCount}-${this.nominalCurrent}-${typeCode}-РОСЭК`;
          
          specs['Артикул'] = newArticle;
          specs['Производитель'] = this.manufacturerBrand || '';
          specs['Количество вводов'] = `${this.inputsCount}`;
          specs['Тип коммутации'] = 'Моноблочный АВР';
          specs['Подключение кабеля'] = this.cableConnection === 'poles' ? 'К полюсам автомата' : 'На дополнительные клеммы';
          specs['Климатическое исполнение'] = this.climateVersion === 'UXL4' ? 'УХЛ4 - сухие теплые помещения' : 'У2 - уличное с обогревом';
        }
        
        return specs;
      },

      // Генерируем новый артикул по формуле
      get dynamicArticle() {
        if (this.commutationType === 'control_cabinet') {
          // Для шкафов управления: ШУ-ПП-{мощность}-1-РОСЭК
          return `ШУ-ПП-${this.motorPower}-1-РОСЭК`;
        } else if (this.commutationType === 'contactors') {
          const actualPolesCount = this.polesCount || (parseInt(this.nominalCurrent) <= 100 ? 'single_phase' : 'three_phase');
          const phaseCode = actualPolesCount === 'single_phase' ? '1Ф' : '3Ф';
          return `АВР-${this.nominalCurrent}-К-${phaseCode}-РОСЭК`;
        } else {
          const typeCode = 'М';
          return `АВР-${this.inputsCount}-${this.nominalCurrent}-${typeCode}-РОСЭК`;
        }
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
        navigator.clipboard.writeText(this.dynamicArticle).then(() => {
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
        if (false) {
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
        } else if (this.commutationType === 'control_cabinet') {
          // Для шкафов управления
          return {
            article: this.dynamicArticle,
            manufacturerBrand: this.manufacturerBrand,
            commutationType: this.commutationType,
            controlType: this.controlType,
            motorPower: this.motorPower,
            inputsCount: '1', // Всегда 1 для шкафов управления
            basePrice: this.basePrice,
            totalPrice: this.totalPrice,
            images: this.images,
            productSpecs: this.productSpecs,
            productTitle: this.productTitle
          };
        } else {
          // Для трехфазных АВР и контакторов
          if (this.commutationType === 'contactors') {
            // Для контакторов используем polesCount, если его нет - определяем по току
            const actualPolesCount = this.polesCount || (parseInt(this.nominalCurrent) <= 100 ? 'single_phase' : 'three_phase');
            const phaseCode = actualPolesCount === 'single_phase' ? '1Ф' : '3Ф';
            const newArticle = `АВР-${this.nominalCurrent}-К-${phaseCode}-РОСЭК`;
            
            return {
              article: newArticle,
              manufacturerBrand: this.manufacturerBrand,
              commutationType: this.commutationType,
              nominalCurrent: this.nominalCurrent,
              polesCount: actualPolesCount,
              cableConnection: this.cableConnection,
              climateVersion: this.climateVersion,
              basePrice: this.basePrice,
              totalPrice: this.totalPrice,
              images: this.images,
              productSpecs: this.productSpecs,
              productTitle: this.productTitle
            };
          } else {
            // Для моноблочных АВР используем inputsCount
            const newArticle = `АВР-${this.inputsCount}-${this.nominalCurrent}-М-РОСЭК`;
            
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
        if (this.commutationType === 'control_cabinet') {
          // Для шкафов управления - возвращаем пустое описание
          return {
            purpose: ``,
            purposeList: [],
            workflow: [],
            features: []
          };
        } else if (false) {
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
      },
      
      // Метод для обновления количества полюсов (для контакторов)
      async updatePolesCount(value) {
        if (this.loading || !this.isOptionAvailable('poles_count', value)) return;
        this.loading = true;
        this.polesCount = value;
        
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
      
      // Метод для обновления типа управления (для шкафов управления)
      async updateControlType(value) {
        if (this.loading) return;
        this.loading = true;
        this.controlType = value;
        
        try {
          await this.loadAvailableOptions();
          
          // Выбираем первую доступную мощность двигателя
          if (this.availableOptions.motor_power && this.availableOptions.motor_power.length > 0) {
            this.motorPower = String(this.availableOptions.motor_power[0]);
          }
          
          await this.loadProductByCharacteristics();
          this.updateCartQuantity();
        } finally {
          this.loading = false;
        }
      },
      
      // Метод для обновления мощности двигателя (для шкафов управления)
      async updateMotorPower(value) {
        if (this.loading) return;
        this.motorPower = value;
        
        await this.loadProductByCharacteristics();
        this.updateCartQuantity();
      }
    };
  });
});
