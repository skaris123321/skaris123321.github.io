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

      this.loadPromise = fetch('../data/products.json?v=2')
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
      const { manufacturer_brand, commutation_type, inputs_count, control_type, motor_power, enclosure_type, connection_type, climate_type, regulation_type, box_type, motor_control_type, feeder_type } = filters;

      let filtered = data.products;
      if (manufacturer_brand) filtered = filtered.filter(p => p.brand === manufacturer_brand);
      if (commutation_type) filtered = filtered.filter(p => p.commutation_type === commutation_type);
      if (inputs_count) filtered = filtered.filter(p => p.inputs_count === inputs_count);
      if (control_type) filtered = filtered.filter(p => p.control_type === control_type);
      if (motor_power) filtered = filtered.filter(p => parseFloat(p.motor_power) === parseFloat(motor_power));
      if (enclosure_type) filtered = filtered.filter(p => p.enclosure_type === enclosure_type);
      if (connection_type) filtered = filtered.filter(p => p.connection_type === connection_type);
      if (climate_type) filtered = filtered.filter(p => p.climate_type === climate_type);
      if (regulation_type) filtered = filtered.filter(p => p.regulation_type === regulation_type);
      if (box_type) filtered = filtered.filter(p => p.box_type === box_type);
      if (motor_control_type) filtered = filtered.filter(p => p.motor_control_type === motor_control_type);
      if (feeder_type) filtered = filtered.filter(p => p.feeder_type === feeder_type);

      const opts = {
        manufacturer_brand: [...new Set(data.products.map(p => p.brand).filter(Boolean))].sort(),
        commutation_type: [],
        inputs_count: [],
        nominal_current: [],
        control_type: [],
        motor_power: [],
        enclosure_type: [],
        connection_type: [],
        climate_type: [],
        regulation_type: [],
        reactive_power: []
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
      } else if (commutation_type === 'reactive_power') {
        // Для компенсации реактивной мощности добавляем опции regulation_type и reactive_power
        let regulationTypeProducts = data.products;
        if (manufacturer_brand) regulationTypeProducts = regulationTypeProducts.filter(p => p.brand === manufacturer_brand);
        if (commutation_type) regulationTypeProducts = regulationTypeProducts.filter(p => p.commutation_type === commutation_type);
        opts.regulation_type = [...new Set(regulationTypeProducts.map(p => p.regulation_type).filter(Boolean))].sort();

        let reactivePowerProducts = data.products;
        if (manufacturer_brand) reactivePowerProducts = reactivePowerProducts.filter(p => p.brand === manufacturer_brand);
        if (commutation_type) reactivePowerProducts = reactivePowerProducts.filter(p => p.commutation_type === commutation_type);
        if (regulation_type) reactivePowerProducts = reactivePowerProducts.filter(p => p.regulation_type === regulation_type);
        opts.reactive_power = [...new Set(reactivePowerProducts.map(p => parseFloat(p.power)).filter(Boolean))].sort((a, b) => a - b);
      } else if (commutation_type === 'motor_control_box') {
        // Для ящиков управления электродвигателями Я5000 добавляем nominal_current
        let currentProducts = data.products;
        if (manufacturer_brand) currentProducts = currentProducts.filter(p => p.brand === manufacturer_brand);
        if (commutation_type) currentProducts = currentProducts.filter(p => p.commutation_type === commutation_type);
        if (box_type) currentProducts = currentProducts.filter(p => p.box_type === box_type);
        if (motor_control_type) currentProducts = currentProducts.filter(p => p.motor_control_type === motor_control_type);
        if (feeder_type) currentProducts = currentProducts.filter(p => p.feeder_type === feeder_type);
        
        opts.nominal_current = [...new Set(currentProducts.map(p => parseFloat(p.nominal_current)).filter(Boolean))].sort((a, b) => a - b);
      } else {
        // Для АВР добавляем nominal_current
        let currentProducts = data.products;
        if (manufacturer_brand) currentProducts = currentProducts.filter(p => p.brand === manufacturer_brand);
        if (commutation_type) currentProducts = currentProducts.filter(p => p.commutation_type === commutation_type);
        if (inputs_count) currentProducts = currentProducts.filter(p => p.inputs_count === inputs_count);
        if (enclosure_type) currentProducts = currentProducts.filter(p => p.enclosure_type === enclosure_type);
        if (connection_type) currentProducts = currentProducts.filter(p => p.connection_type === connection_type);
        if (climate_type) currentProducts = currentProducts.filter(p => p.climate_type === climate_type);
        opts.nominal_current = [...new Set(currentProducts.map(p => parseFloat(p.nominal_current)).filter(Boolean))].sort((a, b) => a - b);
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
            nominal_current: parseFloat(product.nominal_current || 0),
            commutation_type: product.commutation_type,
            manufacturer_brand: product.brand,
            inputs_count: product.inputs_count,
            poles_count: product.poles_count,
            control_type: product.control_type,
            motor_power: product.motor_power,
            start_type: product.start_type,
            pump_count: product.pump_count,
            regulation_type: product.regulation_type,
            reactive_power: product.power,
            box_type: product.box_type || null,
            motor_control_type: product.motor_control_type || null,
            feeder_type: product.feeder_type || null,
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
      const { nominal_current, commutation_type, manufacturer_brand, inputs_count, poles_count, control_type, motor_power, start_type, pump_count, regulation_type, reactive_power, enclosure_type, connection_type, climate_type } = filters;

      // Для шкафов управления требуется motor_power вместо nominal_current
      if (commutation_type === 'control_cabinet' && !motor_power) {
        throw new Error('motor_power required for control cabinets');
      } else if (commutation_type === 'reactive_power' && !reactive_power) {
        throw new Error('reactive_power required for reactive power products');
      } else if (commutation_type === 'motor_control_box' && !nominal_current) {
        throw new Error('nominal_current required for motor control boxes');
      } else if (commutation_type !== 'control_cabinet' && commutation_type !== 'reactive_power' && commutation_type !== 'motor_control_box' && !nominal_current) {
        throw new Error('nominal_current required');
      }

      const product = data.products.find(p => {
        if (commutation_type === 'control_cabinet') {
          // Для шкафов управления
          if (parseFloat(p.motor_power) !== parseFloat(motor_power)) return false;
          if (control_type && p.control_type !== control_type) return false;
          // Для прямого пуска проверяем дополнительные параметры
          if (control_type === 'direct_start') {
            if (start_type && p.start_type !== start_type) return false;
            if (pump_count && p.pump_count !== parseInt(pump_count)) return false;
          }
        } else if (commutation_type === 'reactive_power') {
          // Для компенсации реактивной мощности
          if (parseFloat(p.power) !== parseFloat(reactive_power)) return false;
          if (regulation_type && p.regulation_type !== regulation_type) return false;
        } else if (commutation_type === 'motor_control_box') {
          // Для ящиков управления электродвигателями Я5000
          if (parseFloat(p.nominal_current) !== parseFloat(nominal_current)) return false;
          if (filters.box_type && p.box_type !== filters.box_type) return false;
          if (filters.motor_control_type && p.motor_control_type !== filters.motor_control_type) return false;
          if (filters.feeder_type && p.feeder_type !== filters.feeder_type) return false;
        } else {
          // Для АВР
          if (parseFloat(p.nominal_current) !== parseFloat(nominal_current)) return false;
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
          nominal_current: parseFloat(product.nominal_current || 0),
          commutation_type: product.commutation_type,
          manufacturer_brand: product.brand,
          inputs_count: product.inputs_count,
          poles_count: product.poles_count,
          control_type: product.control_type,
          motor_power: product.motor_power,
          start_type: product.start_type,
          pump_count: product.pump_count,
          regulation_type: product.regulation_type,
          reactive_power: product.power,
          box_type: product.box_type || null,
          motor_control_type: product.motor_control_type || null,
          feeder_type: product.feeder_type || null,
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
      startType: 'direct_start', // 'direct_start', 'frequency_control', 'soft_start' - для прямого пуска
      pumpCount: '1', // '1' или '2' - количество насосов для прямого пуска
      // Параметры для компенсации реактивной мощности
      regulationType: 'unregulated', // 'unregulated' или 'regulated'
      reactivePower: '10', // мощность в кВАр (в базе данных это поле "power")
      step: null, // количество ступеней для автоматически регулируемых установок
      // Параметры для ящиков управления электродвигателями Я5000
      boxType: 'single_feeder', // 'single_feeder', 'double_feeder', 'triple_feeder'
      reversible: false, // true или false - для двухфидерных
      feederType: 'no_auto', // 'no_auto', 'no_auto_contacts', 'with_auto'
      basePrice: 87900,
      article: 'АВР-100-CHINT-2',
      loading: false,
      productSpecs: {},
      productOptions: [], // Опции товара из базы данных
      fullDescription: '',
      documentation: [],
      activeTab: 'specs',
      // Все возможные мощности для реактивной мощности
      allReactivePowers: [5, 10, 15, 25, 35, 40, 50, 75, 80, 90, 100, 125, 140, 150, 160, 175, 180, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500, 525, 550, 575, 600],
      // Все возможные мощности для шкафов управления
      allMotorPowers: [0.75, 1.5, 2.2, 3, 3.7, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 185, 200, 220, 250],
      // Все возможные ступени для автоматически регулируемых установок
      allSteps: [1, 5, 10, 15, 20, 25, 30, 50],
      availableOptions: {
        nominal_current: [],
        commutation_type: [],
        manufacturer_brand: [],
        inputs_count: [],
        poles_count: [],
        control_type: [],
        motor_power: [],
        regulation_type: [],
        reactive_power: [],
        steps: [],
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
        const commutationType = urlParams.get('commutationType') || urlParams.get('commutation_type');
        const motorPower = urlParams.get('motorPower');
        const controlType = urlParams.get('controlType');
        const manufacturerBrand = urlParams.get('manufacturerBrand');
        const startType = urlParams.get('startType');
        const pumpCount = urlParams.get('pumpCount');
        
        // Проверяем параметры для реактивной мощности
        const brand = urlParams.get('brand');
        const regulationType = urlParams.get('regulation_type');
        const power = urlParams.get('power');
        const step = urlParams.get('step');
        
        if (productId) {
          // Если есть ID в URL, загружаем товар по ID
          await this.loadProductById(productId);
        } else if (brand && commutationType === 'reactive_power' && regulationType && power) {
          // Если есть параметры для реактивной мощности, устанавливаем их
          this.manufacturerBrand = brand;
          this.commutationType = commutationType;
          this.regulationType = regulationType;
          this.reactivePower = String(power);
          if (step) {
            this.step = String(step);
          }
          
          await this.loadAvailableOptions();
          await this.loadProduct();
        } else if (commutationType && motorPower && controlType && manufacturerBrand) {
          // Если есть параметры для шкафов управления, устанавливаем их
          this.commutationType = commutationType;
          this.motorPower = motorPower;
          this.controlType = controlType;
          this.manufacturerBrand = manufacturerBrand;
          
          // Для прямого пуска устанавливаем дополнительные параметры
          if (controlType === 'direct_start') {
            this.startType = startType || 'direct_start';
            this.pumpCount = pumpCount || '1';
          }
          
          await this.loadAvailableOptions();
          await this.loadProduct();
        } else if (commutationType === 'motor_control_box' && manufacturerBrand) {
          // Если есть параметры для ящиков управления, устанавливаем их
          this.commutationType = commutationType;
          this.manufacturerBrand = manufacturerBrand;
          
          // Получаем параметры из URL
          const nominalCurrent = urlParams.get('nominalCurrent') || urlParams.get('nominal_current');
          const boxType = urlParams.get('boxType') || urlParams.get('box_type');
          const reversible = urlParams.get('reversible');
          const feederType = urlParams.get('feederType') || urlParams.get('feeder_type');
          
          if (nominalCurrent) this.nominalCurrent = String(nominalCurrent);
          if (boxType) this.boxType = boxType;
          if (reversible !== null) this.reversible = reversible === 'true';
          if (feederType) this.feederType = feederType;
          
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
            // Для прямого пуска добавляем дополнительные параметры
            if (this.controlType === 'direct_start') {
              if (this.startType) filters.start_type = this.startType;
              if (this.pumpCount) filters.pump_count = this.pumpCount;
            }
            filters.inputs_count = '1'; // Всегда 1 для шкафов управления
          } else if (this.commutationType === 'reactive_power') {
            // Для компенсации реактивной мощности используем regulation_type и reactive_power
            if (this.regulationType) filters.regulation_type = this.regulationType;
            if (this.reactivePower) filters.reactive_power = this.reactivePower;
            if (this.step) filters.step = this.step;
          } else if (this.commutationType === 'motor_control_box') {
            // Для ящиков управления электродвигателями Я5000
            // Передаем текущие фильтры для получения доступных опций
            if (this.boxType) filters.box_type = this.boxType;
            if (this.reversible !== null) filters.reversible = this.reversible;
            if (this.nominalCurrent) filters.nominal_current = this.nominalCurrent;
            if (this.feederType) filters.feeder_type = this.feederType;
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
              regulation_type: data.available_options.regulation_type || [],
              reactive_power: data.available_options.reactive_power || [],
              steps: data.available_options.steps || [],
              enclosure_type: data.available_options.enclosure_type || [],
              connection_type: data.available_options.connection_type || [],
              climate_type: data.available_options.climate_type || [],
              motor_control_type: data.available_options.motor_control_type || [],
              feeder_type: data.available_options.feeder_type || [],
              box_type: data.available_options.box_type || [],
              reversible: data.available_options.reversible || []
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
              regulation_type: [],
              reactive_power: [],
              steps: [],
              enclosure_type: [],
              connection_type: [],
              climate_type: [],
              motor_control_type: [],
              feeder_type: [],
              box_type: [],
              reversible: []
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
            regulation_type: [],
            reactive_power: [],
            steps: [],
            enclosure_type: [],
            connection_type: [],
            climate_type: [],
            motor_control_type: [],
            feeder_type: [],
            box_type: [],
            reversible: []
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
          const numValue = parseFloat(value);
          const available = this.availableOptions[optionType].some(opt => parseFloat(opt) === numValue);
          return available;
        }
        
        if (optionType === 'motor_power') {
          const numValue = parseFloat(value);
          return this.availableOptions[optionType].some(opt => parseFloat(opt) === numValue);
        }
        
        // Для reversible сравниваем boolean значения
        if (optionType === 'reversible') {
          return this.availableOptions[optionType].includes(value);
        }
        
        return this.availableOptions[optionType].includes(value);
      },
      
      // Проверка доступности мощности для реактивной мощности
      isReactivePowerAvailable(power) {
        if (!this.availableOptions.reactive_power || !Array.isArray(this.availableOptions.reactive_power)) {
          return false;
        }
        return this.availableOptions.reactive_power.includes(parseFloat(power));
      },
      
      // Проверка доступности мощности двигателя для шкафов управления
      isMotorPowerAvailable(power) {
        if (!this.availableOptions.motor_power || !Array.isArray(this.availableOptions.motor_power)) {
          return false;
        }
        return this.availableOptions.motor_power.includes(parseFloat(power));
      },
      
      // Проверка доступности ступени
      isStepAvailable(step) {
        if (!this.availableOptions.steps || !Array.isArray(this.availableOptions.steps)) {
          return false;
        }
        return this.availableOptions.steps.includes(parseInt(step));
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
            // Для прямого пуска добавляем дополнительные параметры
            if (this.controlType === 'direct_start') {
              filters.start_type = this.startType;
              filters.pump_count = this.pumpCount;
            }
            filters.inputs_count = '1'; // Всегда 1 для шкафов управления
          } else if (this.commutationType === 'reactive_power') {
            // Для компенсации реактивной мощности используем regulation_type и reactive_power
            filters.regulation_type = this.regulationType;
            filters.reactive_power = this.reactivePower;
            if (this.step) {
              filters.step = this.step;
            }
          } else if (this.commutationType === 'motor_control_box') {
            // Для ящиков управления электродвигателями Я5000
            filters.nominal_current = this.nominalCurrent;
            filters.box_type = this.boxType;
            filters.feeder_type = this.feederType;
            filters.reversible = this.reversible;
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
            
            // Формируем изображения для всех товаров
            if (product.main_image && product.main_image.trim() !== '') {
              imageList.push(product.main_image);
            }
            if (product.images && product.images.length > 0) {
              // Добавляем дополнительные изображения, исключая дубликаты
              product.images.forEach(img => {
                if (img && img.trim() !== '' && img !== product.main_image) {
                  imageList.push(img);
                }
              });
            }
            
            this.images = imageList.map(img => {
              // Если путь относительный, добавляем ../
              return img.startsWith('images/') ? '../' + img : img;
            });
            
            this.productSpecs = product.specs || {};
            this.productOptions = product.options || [];
            this.fullDescription = product.full_description || product.description || '';
            this.documentation = product.documentation || [];
            
            if (this.commutationType === 'control_cabinet') {
              // Для шкафов управления устанавливаем параметры из продукта
              this.motorPower = String(product.motor_power);
              this.controlType = product.control_type;
              this.manufacturerBrand = product.manufacturer_brand;
              // Для прямого пуска устанавливаем дополнительные параметры
              if (product.control_type === 'direct_start') {
                this.startType = product.start_type || 'direct_start';
                this.pumpCount = String(product.pump_count || '1');
              }
            } else if (this.commutationType === 'reactive_power') {
              // Для компенсации реактивной мощности устанавливаем параметры из продукта
              this.regulationType = product.regulation_type;
              this.reactivePower = String(product.reactive_power);
              this.manufacturerBrand = product.manufacturer_brand;
              if (product.step) {
                this.step = String(product.step);
              }
            } else if (this.commutationType === 'motor_control_box') {
              // Для ящиков управления электродвигателями Я5000 устанавливаем параметры из продукта
              this.nominalCurrent = String(product.nominal_current);
              this.boxType = product.box_type;
              this.reversible = product.reversible || false;
              this.feederType = product.feeder_type;
              this.manufacturerBrand = product.manufacturer_brand;
            } else {
              // Для АВР устанавливаем параметры из продукта
              this.nominalCurrent = String(product.nominal_current);
              this.commutationType = product.commutation_type;
              this.manufacturerBrand = product.manufacturer_brand;
              this.inputsCount = product.inputs_count;
              
              const current = parseFloat(product.nominal_current);
              if (current >= 100 && current <= 800) {
                this.cableConnection = 'terminals';
              }
            }
            
            // Сбрасываем индекс изображения
            this.currentIndex = 0;
            this.thumbnailScroll = 0;
            
            // Перезагружаем доступные опции после загрузки товара для актуализации доступных значений
            await this.loadAvailableOptions();
            
            // Загружаем документы для текущего продукта (только для АВР)
            if (window.documentsManager && this.commutationType !== 'reactive_power' && this.commutationType !== 'control_cabinet') {
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
              // Для прямого пуска устанавливаем дополнительные параметры
              if (product.control_type === 'direct_start') {
                this.startType = product.start_type || 'direct_start';
                this.pumpCount = String(product.pump_count || '1');
              }
            } else if (product.commutation_type === 'motor_control_box') {
              // Для ящиков управления электродвигателями Я5000
              this.nominalCurrent = String(product.nominal_current);
              this.boxType = product.box_type || 'single_feeder';
              this.reversible = product.reversible || false;
              this.feederType = product.feeder_type || 'no_auto';
              
              } else if (product.commutation_type === 'reactive_power') {
              // Для компенсации реактивной мощности
              this.regulationType = product.regulation_type || 'unregulated';
              this.reactivePower = String(product.reactive_power || '10');
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
            
            // Формируем изображения для всех товаров
            if (product.main_image && product.main_image.trim() !== '') {
              imageList.push(product.main_image);
            }
            if (product.images && product.images.length > 0) {
              // Добавляем дополнительные изображения, исключая дубликаты
              product.images.forEach(img => {
                if (img && img.trim() !== '' && img !== product.main_image) {
                  imageList.push(img);
                }
              });
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
            // Для прямого пуска добавляем дополнительные параметры
            if (this.controlType === 'direct_start') {
              filters.start_type = this.startType;
              filters.pump_count = this.pumpCount;
            }
            filters.inputs_count = '1'; // Всегда 1 для шкафов управления
          } else if (this.commutationType === 'reactive_power') {
            // Для компенсации реактивной мощности используем reactive_power, regulation_type и step
            filters.reactive_power = this.reactivePower;
            filters.regulation_type = this.regulationType;
            if (this.step) filters.step = this.step;
            } else if (this.commutationType === 'motor_control_box') {
            // Для ящиков управления используем nominal_current
            filters.nominal_current = this.nominalCurrent;
            filters.box_type = this.boxType;
            // Для трехфидерных используем фиксированный тип, для остальных - выбранный
            filters.feeder_type = this.boxType === 'triple_feeder' ? 'triple_fixed' : this.feederType;
            filters.reversible = this.reversible;
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
            
            // Формируем изображения для всех товаров
            if (product.main_image && product.main_image.trim() !== '') {
              imageList.push(product.main_image);
            }
            if (product.images && product.images.length > 0) {
              // Добавляем дополнительные изображения, исключая дубликаты
              product.images.forEach(img => {
                if (img && img.trim() !== '' && img !== product.main_image) {
                  imageList.push(img);
                }
              });
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
          } else if (this.commutationType === 'reactive_power') {
            // Для компенсации реактивной мощности проверяем доступность текущих параметров
            if (!this.availableOptions.regulation_type || !this.availableOptions.regulation_type.includes(this.regulationType)) {
              if (this.availableOptions.regulation_type && this.availableOptions.regulation_type.length > 0) {
                this.regulationType = this.availableOptions.regulation_type[0];
              }
            }
            
            if (!this.availableOptions.reactive_power || !this.availableOptions.reactive_power.includes(parseFloat(this.reactivePower))) {
              if (this.availableOptions.reactive_power && this.availableOptions.reactive_power.length > 0) {
                this.reactivePower = String(this.availableOptions.reactive_power[0]);
              }
            }
          } else {
            // Для АВР проверяем доступность текущих параметров
            if (!this.availableOptions.inputs_count || !this.availableOptions.inputs_count.includes(this.inputsCount)) {
              if (this.availableOptions.inputs_count && this.availableOptions.inputs_count.length > 0) {
                this.inputsCount = this.availableOptions.inputs_count[0];
              }
            }
            
            if (!this.availableOptions.nominal_current || !this.availableOptions.nominal_current.some(opt => parseFloat(opt) === parseFloat(this.nominalCurrent))) {
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
      
      // Метод для обновления типа управления (для ящиков управления)
      async updateMotorControlType(value) {
        if (this.loading) return;
        this.motorControlType = value;
        
        // Обновляем доступные опции
        await this.loadAvailableOptions();
        
        // Проверяем, доступен ли текущий ток
        if (!this.isOptionAvailable('nominal_current', this.nominalCurrent)) {
          // Если текущий ток недоступен, выбираем первый доступный
          if (this.availableOptions.nominal_current && this.availableOptions.nominal_current.length > 0) {
            this.nominalCurrent = String(this.availableOptions.nominal_current[0]);
          }
        }
        
        await this.loadProductByCharacteristics();
        this.updateCartQuantity();
      },
      
      // Метод для обновления типа фидера (для ящиков управления)
      async updateFeederType(value) {
        if (this.loading) return;
        this.feederType = value;
        
        // Обновляем доступные опции
        await this.loadAvailableOptions();
        
        // Проверяем, доступен ли текущий ток
        if (!this.isOptionAvailable('nominal_current', this.nominalCurrent)) {
          // Если текущий ток недоступен, выбираем первый доступный
          if (this.availableOptions.nominal_current && this.availableOptions.nominal_current.length > 0) {
            this.nominalCurrent = String(this.availableOptions.nominal_current[0]);
          }
        }
        
        await this.loadProductByCharacteristics();
        this.updateCartQuantity();
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
        if (this.commutationType === 'motor_control_box') {
          // Для ящиков управления электродвигателями Я5000
          const boxTypeNames = {
            'single_feeder': 'однофидерный',
            'double_feeder': 'двухфидерный',
            'triple_feeder': 'трехфидерный'
          };
          const boxTypeName = boxTypeNames[this.boxType] || 'однофидерный';
          const reversibleName = this.reversible ? 'реверсивный' : 'нереверсивный';
          return `Ящик управления Я5000 ${boxTypeName} ${reversibleName} ${this.nominalCurrent || '0.6'}А`;
        } else if (this.commutationType === 'control_cabinet') {
          if (this.controlType === 'direct_start') {
            // Для шкафов управления с прямым пуском
            const startTypeNames = {
              'direct_start': 'прямым пуском',
              'frequency_control': 'частотным регулированием',
              'soft_start': 'плавным пуском'
            };
            const startTypeName = startTypeNames[this.startType] || 'прямым пуском';
            return `Шкаф управления с ${startTypeName} ${this.motorPower || '7.5'} кВт`;
          } else {
            // Для других типов шкафов управления
            const controlTypeNames = {
              'soft_start': 'с плавным пуском',
              'frequency_converter': 'с преобразователем частоты',
              'direct_start': 'с прямым пуском'
            };
            const controlTypeName = controlTypeNames[this.controlType] || 'с плавным пуском';
            return `Шкаф управления ${controlTypeName} ${this.motorPower || '7.5'} кВт`;
          }
        } else if (this.commutationType === 'reactive_power') {
          // Для компенсации реактивной мощности
          const regulationTypeName = this.regulationType === 'unregulated' ? 'Нерегулируемая' : 'Автоматически регулируемая';
          let title = `${regulationTypeName} конденсаторная установка ${this.reactivePower || '10'} кВАр`;
          // Добавляем информацию о ступенях для регулируемых установок
          if (this.regulationType === 'regulated' && this.step) {
            title += `, ${this.step} ступеней`;
          }
          return title;
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
      
      getReactivePowerTypeDisplayName() {
        if (this.regulationType === 'unregulated') {
          return 'Нерегулируемые конденсаторные установки';
        } else if (this.regulationType === 'regulated') {
          return 'Автоматически регулируемые конденсаторные установки';
        }
        return 'Компенсация реактивной мощности';
      },
      
      getMotorControlBoxTypeDisplayName() {
        const boxTypeNames = {
          'single_feeder': 'Однофидерные',
          'double_feeder': 'Двухфидерные',
          'triple_feeder': 'Трехфидерные нереверсивные'
        };
        return boxTypeNames[this.boxType] || 'Ящики управления Я5000';
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
        
        // Для реактивной мощности просто возвращаем specs из базы данных
        if (this.commutationType === 'reactive_power') {
          // Переводим ключи, если они на английском, и нормализуем значения
          for (const [key, value] of Object.entries(rawSpecs)) {
            const translatedKey = this.translateSpecKey(key);
            const normalizedValue = this.normalizeSpecValue(translatedKey, value);
            specs[translatedKey] = normalizedValue;
          }
          return this.sortSpecs(specs);
        }
        
        // Для ящиков управления электродвигателями Я5000 возвращаем specs из базы данных
        if (this.commutationType === 'motor_control_box') {
          // Переводим ключи, если они на английском, и нормализуем значения
          for (const [key, value] of Object.entries(rawSpecs)) {
            // Пропускаем пустые значения, undefined, null
            if (value === undefined || value === null || value === '') {
              continue;
            }
            
            const translatedKey = this.translateSpecKey(key);
            
            // Для поля "Количество фидеров" используем значение в зависимости от feederType
            if (translatedKey === 'Количество фидеров') {
              if (this.feederType === 'double_no_auto') {
                specs[translatedKey] = 'Двухфидерный, без переключателя на автоматический режим';
              } else if (this.feederType === 'double_with_auto') {
                specs[translatedKey] = 'Двухфидерный, с переключателем на автоматический режим';
              } else {
                specs[translatedKey] = value;
              }
            } else {
              const normalizedValue = this.normalizeSpecValue(translatedKey, value);
              specs[translatedKey] = normalizedValue;
            }
          }
          // Добавляем артикул и производителя
          specs['Артикул'] = this.dynamicArticle;
          specs['Производитель'] = this.manufacturerBrand || '';
          return this.sortSpecs(specs);
        }
        
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
          // Для шкафов управления - динамические характеристики
          specs['Артикул'] = this.dynamicArticle;
          specs['Производитель'] = this.manufacturerBrand || '';
          specs['Количество вводов'] = '1';
          specs['Мощность двигателя'] = this.motorPower + ' кВт';
          
          // Тип управления в зависимости от controlType
          if (this.controlType === 'soft_start') {
            specs['Тип управления'] = 'Плавный пуск';
          } else if (this.controlType === 'frequency_converter') {
            specs['Тип управления'] = 'Преобразователь частоты';
          } else if (this.controlType === 'direct_start') {
            specs['Тип управления'] = 'Прямой пуск';
            // Для прямого пуска добавляем количество насосов
            specs['Количество насосов'] = this.pumpCount || '1';
          }
          
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
        
        return this.sortSpecs(specs);
      },
      
      // Функция для сортировки характеристик в правильном порядке
      sortSpecs(specs) {
        // Определяем порядок общих полей
        const order = [
          'Артикул',
          'Производитель',
          'Номинальный ток',
          'Номинальный ток щитка, А',
          'Мощность двигателя',
          'Мощность, кВАр',
          'Ток, Iном. А',
          'Тип коммутации',
          'Тип управления',
          'Тип ящика',
          'Тип регулирования',
          'Тип',
          'Количество вводов',
          'Количество полюсов',
          'Количество фидеров',
          'Количество фаз',
          'Количество насосов',
          'Номинальное рабочее напряжение',
          'Подключение кабеля',
          'Климатическое исполнение',
          'Габариты',
          'Габариты (ВхШхГ), мм',
          'Ширина, мм',
          'Высота, мм',
          'Глубина, мм',
          'Вес, кг',
          'Степень защиты корпуса',
          'Степень защиты'
        ];
        
        const sorted = {};
        
        // Сначала добавляем поля в заданном порядке
        order.forEach(key => {
          if (specs[key] !== undefined) {
            sorted[key] = specs[key];
          }
        });
        
        // Затем добавляем остальные поля (которых нет в order)
        Object.keys(specs).forEach(key => {
          if (!order.includes(key)) {
            sorted[key] = specs[key];
          }
        });
        
        return sorted;
      },

      // Генерируем новый артикул по формуле
      get dynamicArticle() {
        if (this.commutationType === 'motor_control_box') {
          // Для ящиков управления электродвигателями Я5000 возвращаем артикул из базы данных
          return this.article || '';
        } else if (this.commutationType === 'reactive_power') {
          // Для реактивной мощности возвращаем артикул из базы данных
          return this.article || '';
        } else if (this.commutationType === 'control_cabinet') {
          if (this.controlType === 'direct_start') {
            // Для шкафов управления с прямым пуском: ШУ-ПП-{количество насосов}-{мощность}-1-РОСЭК
            // Все типы пуска (прямой/частотное регулирование/плавный) имеют одинаковый артикул с "ПП"
            return `ШУ-ПП-${this.pumpCount || '1'}-${this.motorPower}-1-РОСЭК`;
          } else if (this.controlType === 'frequency_converter') {
            // Для преобразователей частоты: ШУ-ПЧ-{мощность}-1-РОСЭК
            return `ШУ-ПЧ-${this.motorPower}-1-РОСЭК`;
          } else {
            // Для других типов: ШУ-ПП-{мощность}-1-РОСЭК
            return `ШУ-ПП-${this.motorPower}-1-РОСЭК`;
          }
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
        if (this.commutationType === 'motor_control_box') {
          // Для ящиков управления электродвигателями Я5000
          return {
            article: this.dynamicArticle,
            manufacturerBrand: this.manufacturerBrand,
            commutationType: this.commutationType,
            nominalCurrent: this.nominalCurrent,
            boxType: this.boxType,
            reversible: this.reversible,
            feederType: this.feederType,
            basePrice: this.basePrice,
            totalPrice: this.totalPrice,
            images: this.images,
            productSpecs: this.productSpecs,
            productTitle: this.productTitle
          };
        } else if (false) {
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
          const productData = {
            article: this.dynamicArticle,
            manufacturerBrand: this.manufacturerBrand,
            commutationType: this.commutationType,
            controlType: this.controlType,
            motorPower: this.motorPower,
            basePrice: this.basePrice,
            totalPrice: this.totalPrice,
            images: this.images,
            productSpecs: this.productSpecs,
            productTitle: this.productTitle
          };
          
          // Для прямого пуска добавляем дополнительные параметры
          if (this.controlType === 'direct_start') {
            productData.startType = this.startType;
            productData.pumpCount = this.pumpCount;
          }
          
          return productData;
        } else if (this.commutationType === 'reactive_power') {
          // Для компенсации реактивной мощности
          const productData = {
            article: this.dynamicArticle,
            manufacturerBrand: this.manufacturerBrand,
            commutationType: this.commutationType,
            regulationType: this.regulationType,
            reactivePower: this.reactivePower,
            basePrice: this.basePrice,
            totalPrice: this.totalPrice,
            images: this.images,
            productSpecs: this.productSpecs,
            productTitle: this.productTitle
          };
          
          // Для регулируемых установок добавляем количество ступеней
          if (this.regulationType === 'regulated' && this.step) {
            productData.step = this.step;
          }
          
          return productData;
        } else if (this.commutationType === 'motor_control_box') {
          // Для ящиков управления Я5000
          const productData = {
            article: this.article,
            manufacturerBrand: this.manufacturerBrand,
            commutationType: this.commutationType,
            boxType: this.boxType,
            feederType: this.feederType,
            nominalCurrent: this.nominalCurrent,
            reversible: this.reversible,
            basePrice: this.basePrice,
            totalPrice: this.totalPrice,
            images: this.images,
            productSpecs: this.productSpecs,
            productTitle: this.productTitle
          };
          
          return productData;
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
          // Для шкафов управления - возвращаем описание в зависимости от типа управления
          if (this.controlType === 'soft_start') {
            return {
              purpose: `Шкаф предназначен для автоматизированного управления трёхфазным асинхронным двигателем с короткозамкнутым ротором посредством устройства плавного пуска (УПП). Обеспечивает:`,
              purposeList: [
                'плавный разгон и торможение двигателя (исключение ударных нагрузок);',
                'снижение пусковых токов (в 3–5 раз относительно прямого пуска);',
                'защиту двигателя и оборудования от механических и гидравлических ударов;',
                'повышение ресурса двигателя и приводных механизмов.'
              ],
              workflow: [
                {
                  title: 'Плавный пуск',
                  text: 'Постепенное увеличение напряжения на обмотках статора (заданное время разгона: 5–60 с).'
                },
                {
                  title: 'Плавное торможение',
                  text: 'Контролируемое снижение скорости (время торможения: 5–60 с).'
                },
                {
                  title: 'Ограничение пускового тока',
                  text: 'Настройка максимального тока пуска (40–500 % от номинального).'
                },
                {
                  title: 'Защитные функции',
                  text: 'От перегрузки по току; от короткого замыкания; от перегрева УПП и двигателя; от обрыва фазы; от перекоса фаз; от пониженного/повышенного напряжения.'
                },
                {
                  title: 'Режимы управления',
                  text: 'Ручной (с панели шкафа); автоматический (по сигналам внешних датчиков/ПЛК); дистанционный (через интерфейсы связи).'
                },
                {
                  title: 'Индикация и диагностика',
                  text: 'Статус работы (пуск/работа/остановка/авария); текущие параметры (ток, напряжение, температура); архив аварий с временем и кодом ошибки.'
                }
              ],
              features: [
                {
                  name: 'Снижение механических нагрузок',
                  desc: '— Снижение механических нагрузок на вал, подшипники, муфты'
                },
                {
                  name: 'Экономия электроэнергии',
                  desc: '— Экономия электроэнергии за счёт уменьшения пусковых токов'
                },
                {
                  name: 'Увеличение срока службы',
                  desc: '— Увеличение срока службы двигателя и приводных механизмов'
                },
                {
                  name: 'Минимизация просадок напряжения',
                  desc: '— Минимизация просадок напряжения в сети'
                },
                {
                  name: 'Гибкость настройки',
                  desc: '— Гибкость настройки под конкретные условия работы'
                },
                {
                  name: 'Интеграция в АСУ',
                  desc: '— Интеграция в АСУ через цифровые интерфейсы'
                }
              ]
            };
          } else if (this.controlType === 'frequency_converter') {
            return {
              purpose: `Шкаф предназначен для комплексного управления трёхфазным асинхронным двигателем посредством преобразователя частоты (ПЧ). Обеспечивает:`,
              purposeList: [
                'плавное регулирование скорости вращения в широком диапазоне (от 0 до 100 %);',
                'энергосбережение за счёт оптимизации нагрузки;',
                'защиту двигателя и механизмов от аварийных режимов;',
                'интеграцию в автоматизированные системы управления (АСУ ТП).'
              ],
              workflow: [
                {
                  title: 'Регулирование скорости',
                  text: 'Изменение частоты выходного напряжения ПЧ (диапазон: 0,1–400 Гц).'
                },
                {
                  title: 'Режимы управления',
                  text: 'Ручной (с панели шкафа); автоматический (по заданным параметрам/датчикам); дистанционный (через интерфейсы связи).'
                },
                {
                  title: 'Защитные функции',
                  text: 'От перегрузки по току; от короткого замыкания; от перегрева двигателя и ПЧ; от обрыва фазы; от перекоса фаз; от пониженного/повышенного напряжения; от превышения момента.'
                },
                {
                  title: 'Автоматические алгоритмы',
                  text: 'ПИД‑регулирование (поддержание заданного параметра: давления, расхода и т. п.); чередование двигателей (выравнивание моторесурса); аварийный останов по внешним сигналам (пожарная сигнализация и др.).'
                },
                {
                  title: 'Мониторинг и диагностика',
                  text: 'Текущие параметры (ток, напряжение, частота, мощность); температура ключевых узлов; архив аварий с временем и кодом ошибки; счётчик наработки двигателя.'
                },
                {
                  title: 'Интерфейсы связи',
                  text: 'RS‑485, Modbus RTU, Profibus, Ethernet (опционально).'
                }
              ],
              features: [
                {
                  name: 'Энергосбережение',
                  desc: '— Снижение потребления электроэнергии на 20–50 % за счёт оптимизации нагрузки'
                },
                {
                  name: 'Плавность регулирования',
                  desc: '— Исключение механических ударов, гидроударов'
                },
                {
                  name: 'Увеличение ресурса',
                  desc: '— Снижение износа двигателя, подшипников, редукторов'
                },
                {
                  name: 'Точное поддержание параметров',
                  desc: '— Стабильность давления, расхода, температуры'
                },
                {
                  name: 'Гибкость настройки',
                  desc: '— Адаптация под технологические процессы'
                },
                {
                  name: 'Дистанционный контроль',
                  desc: '— Интеграция в АСУ ТП через цифровые интерфейсы'
                },
                {
                  name: 'Снижение пусковых токов',
                  desc: '— Отсутствие просадок напряжения в сети'
                }
              ]
            };
          } else if (this.controlType === 'direct_start') {
            return {
              purpose: `Шкаф предназначен для стандартного включения и отключения трёхфазного асинхронного двигателя по схеме прямого пуска (прямого подключения к сети). Обеспечивает:`,
              purposeList: [
                'надёжный пуск двигателя при полной нагрузке;',
                'базовую защиту от аварийных режимов;',
                'ручное или автоматическое управление в простых технологических процессах.',
                'Отличается простотой конструкции, низкой стоимостью и высокой надёжностью по сравнению с шкафами плавного пуска или частотного регулирования.'
              ],
              workflow: [
                {
                  title: 'Пуск двигателя',
                  text: 'Прямое подключение обмоток статора к сети (без промежуточных устройств снижения пускового тока).'
                },
                {
                  title: 'Остановка двигателя',
                  text: 'Отключение от сети по команде оператора или автоматики.'
                },
                {
                  title: 'Защита от аварийных режимов',
                  text: 'Короткое замыкание (мгновенное отключение); перегрузка по току (с выдержкой времени); обрыв фазы; перекосы напряжений; превышение температуры двигателя (при наличии датчика).'
                },
                {
                  title: 'Режимы управления',
                  text: 'Ручной (с панели шкафа); автоматический (по сигналам датчиков/ПЛК); дистанционный (через внешние команды).'
                },
                {
                  title: 'Индикация и сигнализация',
                  text: 'Статус работы («Работа», «Авария», «Останов»); световая сигнализация аварийных состояний; передача сигналов в АСУ ТП (опционально).'
                }
              ],
              features: [
                {
                  name: 'Простота конструкции и обслуживания',
                  desc: '— Простота конструкции и обслуживания'
                },
                {
                  name: 'Низкая стоимость',
                  desc: '— Низкая стоимость по сравнению с УПП и ПЧ'
                },
                {
                  name: 'Высокая надёжность',
                  desc: '— Высокая надёжность (минимум электронных компонентов)'
                },
                {
                  name: 'Быстрый монтаж и настройка',
                  desc: '— Быстрый монтаж и настройка'
                }
              ]
            };
          }
          
          // Если тип управления не определён, возвращаем пустое описание
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
        } else if (this.commutationType === 'motor_control_box') {
          // Ящики управления
          return {
            purpose: `Ящики управления типа Я5000 предназначены для местного, дистанционного и автоматического управления асинхронными электродвигателями с короткозамкнутым ротором мощностью до 75 кВт, работающими в продолжительном, кратковременном и повторно-кратковременном режимах. Ящики управления типа Я5000 изготавливаются со степенью защиты IP31. Ящики управления монтируются в металлических шкафах с монтажной панелью. Ящики комплектуются в зависимости от обозначения и типового индекса: автоматическими выключателями, контакторами, тепловыми реле, светосигнальной арматурой и аппаратурой управления (кнопки, переключатели). Номинальное напряжение главной цепи – 400 В. Номинальное напряжение цепи управления – 230 В.`,
            purposeList: [],
            workflow: [],
            features: [
              {
                name: 'Высокий уровень надёжности и безопасности',
                desc: 'в эксплуатации групп асинхронных двигателей'
              },
              {
                name: 'Широкий выбор модификаций',
                desc: ''
              },
              {
                name: 'Высокая технологичность и простота сборки',
                desc: ''
              },
              {
                name: 'Высокий уровень электробезопасности',
                desc: ''
              },
              {
                name: 'Сертификат соответствия',
                desc: ''
              },
              {
                name: 'Наличие сертифицированных сборщиков',
                desc: 'в крупнейших регионах РФ'
              },
              {
                name: 'Короткие сроки поставки',
                desc: 'компонентов решения обеспечиваются наличием широкой складской и партнерской сети'
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
        
        // Возвращаем пустое описание по умолчанию
        return {
          purpose: '',
          purposeList: [],
          workflow: [],
          features: []
        };
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
      
      // Метод для обновления типа управления (для шкафов управления)
      async updateControlType(value) {
        if (this.loading) return;
        this.loading = true;
        this.controlType = value;
        
        try {
          await this.loadAvailableOptions();
          
          // Выбираем первую доступную мощность двигателя для нового типа
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
        if (this.loading || !this.isOptionAvailable('motor_power', value)) return;
        this.motorPower = value;
        
        await this.loadProductByCharacteristics();
        this.updateCartQuantity();
      },
      
      // Метод для обновления типа пуска (для шкафов управления с прямым пуском)
      async updateStartType(value) {
        if (this.loading) return;
        this.startType = value;
        
        await this.loadProductByCharacteristics();
        this.updateCartQuantity();
      },
      
      // Метод для обновления количества насосов (для шкафов управления с прямым пуском)
      async updatePumpCount(value) {
        if (this.loading) return;
        this.pumpCount = value;
        
        await this.loadProductByCharacteristics();
        this.updateCartQuantity();
      },
      
      // Метод для обновления типа регулирования (для компенсации реактивной мощности)
      async updateRegulationType(value) {
        if (this.loading) return;
        this.loading = true;
        this.regulationType = value;
        
        try {
          await this.loadAvailableOptions();
          
          // Выбираем первую доступную мощность
          if (this.availableOptions.reactive_power && this.availableOptions.reactive_power.length > 0) {
            this.reactivePower = String(this.availableOptions.reactive_power[0]);
          }
          
          await this.loadProductByCharacteristics();
          this.updateCartQuantity();
        } finally {
          this.loading = false;
        }
      },
      
      // Метод для обновления мощности (для компенсации реактивной мощности)
      async updateReactivePower(value) {
        if (this.loading) return;
        this.reactivePower = value;
        
        // Сбрасываем выбранные ступени при смене мощности
        this.step = null;
        
        // Перезагружаем доступные опции чтобы получить доступные ступени для новой мощности
        await this.loadAvailableOptions();
        
        // Если есть доступные ступени, выбираем первую
        if (this.availableOptions.steps && this.availableOptions.steps.length > 0) {
          this.step = String(this.availableOptions.steps[0]);
        }
        
        await this.loadProductByCharacteristics();
        
        this.updateCartQuantity();
      },
      
      // Метод для обновления количества ступеней (для автоматически регулируемых установок)
      async updateStep(value) {
        if (this.loading) return;
        this.step = value;
        
        await this.loadProductByCharacteristics();
        
        this.updateCartQuantity();
      },
      
      // МЕТОДЫ ДЛЯ ЯЩИКОВ УПРАВЛЕНИЯ Я5000
      
      // Метод для обновления типа ящика
      async updateBoxType(value) {
        if (this.loading) return;
        this.loading = true;
        this.boxType = value;
        
        try {
          await this.loadAvailableOptions();
          
          // Если текущий тип фидера недоступен, выбираем первый доступный
          if (this.availableOptions.feeder_type && this.availableOptions.feeder_type.length > 0) {
            if (!this.availableOptions.feeder_type.includes(this.feederType)) {
              this.feederType = this.availableOptions.feeder_type[0];
            }
          }
          
          // Выбираем первый доступный ток
          if (this.availableOptions.nominal_current && this.availableOptions.nominal_current.length > 0) {
            this.nominalCurrent = String(this.availableOptions.nominal_current[0]);
          }
          
          await this.loadProductByCharacteristics();
          this.updateCartQuantity();
        } finally {
          this.loading = false;
        }
      },
      
      // Метод для обновления реверсивности (только для двухфидерных)
      async updateReversible(value) {
        if (this.loading) return;
        this.loading = true;
        this.reversible = value;
        
        try {
          await this.loadAvailableOptions();
          
          // Если текущий тип фидера недоступен, выбираем первый доступный
          if (this.availableOptions.feeder_type && this.availableOptions.feeder_type.length > 0) {
            if (!this.availableOptions.feeder_type.includes(this.feederType)) {
              this.feederType = this.availableOptions.feeder_type[0];
            }
          }
          
          await this.loadProductByCharacteristics();
          this.updateCartQuantity();
        } finally {
          this.loading = false;
        }
      },
      
      // Метод для обновления типа фидера (переключателя)
      async updateFeederType(value) {
        if (this.loading) return;
        this.loading = true;
        this.feederType = value;
        
        try {
          await this.loadAvailableOptions();
          await this.loadProductByCharacteristics();
          this.updateCartQuantity();
        } finally {
          this.loading = false;
        }
      }
    };
  });
});

// Parallax эффект при скролле
document.addEventListener('DOMContentLoaded', () => {
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  
  if (parallaxElements.length === 0) return;
  
  const handleParallax = () => {
    const scrollY = window.scrollY;
    
    parallaxElements.forEach(element => {
      const speed = parseFloat(element.getAttribute('data-parallax')) || 0.5;
      const offset = scrollY * speed;
      element.style.transform = `translateY(${offset}px)`;
    });
  };
  
  // Используем requestAnimationFrame для плавной анимации
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(handleParallax);
      ticking = true;
      setTimeout(() => { ticking = false; }, 16);
    }
  });
});

// Плавное появление элементов при скролле
document.addEventListener('DOMContentLoaded', () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Добавляем класс для элементов, которые должны появляться при скролле
  document.querySelectorAll('.fade-in-on-scroll').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});

// VK icon hover color change
document.addEventListener('DOMContentLoaded', () => {
  const vkLinks = document.querySelectorAll('.footer-vk-link');
  
  vkLinks.forEach(link => {
    const icon = link.querySelector('.footer-vk-icon');
    if (!icon) return;
    
    // Store original color
    const originalColor = '#707F9A';
    const hoverColor = '#F16664';
    
    link.addEventListener('mouseenter', () => {
      const paths = icon.querySelectorAll('path');
      paths.forEach(path => {
        path.setAttribute('fill', hoverColor);
      });
    });
    
    link.addEventListener('mouseleave', () => {
      const paths = icon.querySelectorAll('path');
      paths.forEach(path => {
        path.setAttribute('fill', originalColor);
      });
    });
  });
});
