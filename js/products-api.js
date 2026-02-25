/**
 * Клиентский API для работы с продуктами
 * Работает напрямую с JSON файлом без необходимости сервера
 */

class ProductsAPI {
  constructor() {
    this.productsData = null;
    this.loadPromise = null;
    // Версия для кэш-бастинга картинок (увеличивайте при обновлении картинок)
    this.imageVersion = '5';
  }

  // Добавляет версию к URL картинки для обхода кэша браузера
  addImageVersion(imageUrl) {
    if (!imageUrl) return imageUrl;
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}v=${this.imageVersion}`;
  }

  async loadProducts() {
    if (this.productsData) {
      return this.productsData;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = fetch('../data/products.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load products.json: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data.products)) {
          throw new Error('Invalid products.json format');
        }
        this.productsData = data;
        return data;
      })
      .catch(error => {
        this.loadPromise = null;
        throw error;
      });

    return this.loadPromise;
  }

  async getAvailableOptions(filters = {}) {
    const data = await this.loadProducts();
    const { manufacturer_brand, commutation_type, inputs_count, poles_count, control_type, motor_power, regulation_type } = filters;

    // Фильтруем продукты по заданным параметрам
    let filteredProducts = data.products;

    if (manufacturer_brand) {
      filteredProducts = filteredProducts.filter(p => p.brand === manufacturer_brand);
    }
    if (commutation_type) {
      filteredProducts = filteredProducts.filter(p => p.commutation_type === commutation_type);
    }
    if (inputs_count) {
      filteredProducts = filteredProducts.filter(p => p.inputs_count === inputs_count);
    }
    if (poles_count) {
      filteredProducts = filteredProducts.filter(p => p.poles_count === poles_count);
    }
    if (control_type) {
      filteredProducts = filteredProducts.filter(p => p.control_type === control_type);
    }
    if (motor_power) {
      filteredProducts = filteredProducts.filter(p => parseFloat(p.motor_power) === parseFloat(motor_power));
    }
    if (regulation_type) {
      filteredProducts = filteredProducts.filter(p => p.regulation_type === regulation_type);
    }

    // Получаем уникальные значения
    const availableOptions = {
      nominal_current: [],
      commutation_type: [],
      manufacturer_brand: [],
      inputs_count: [],
      poles_count: [],
      control_type: [],
      motor_power: [],
      regulation_type: [],
      reactive_power: [],
      steps: []
    };

    // Все бренды
    const allBrands = [...new Set(data.products.map(p => p.brand).filter(Boolean))];
    availableOptions.manufacturer_brand = allBrands.sort();

    // Тип коммутации (с учетом бренда если выбран)
    let typeProducts = data.products;
    if (manufacturer_brand) {
      typeProducts = typeProducts.filter(p => p.brand === manufacturer_brand);
    }
    const commutationTypes = [...new Set(typeProducts.map(p => p.commutation_type).filter(Boolean))];
    availableOptions.commutation_type = commutationTypes.sort();

    // Для шкафов управления добавляем control_type и motor_power
    if (commutation_type === 'control_cabinet') {
      // Тип управления (с учетом бренда)
      let controlTypeProducts = data.products.filter(p => p.commutation_type === 'control_cabinet');
      if (manufacturer_brand) {
        controlTypeProducts = controlTypeProducts.filter(p => p.brand === manufacturer_brand);
      }
      const controlTypes = [...new Set(controlTypeProducts.map(p => p.control_type).filter(Boolean))];
      availableOptions.control_type = controlTypes.sort();

      // Мощность двигателя (с учетом бренда и типа управления)
      let motorPowerProducts = data.products.filter(p => p.commutation_type === 'control_cabinet');
      if (manufacturer_brand) {
        motorPowerProducts = motorPowerProducts.filter(p => p.brand === manufacturer_brand);
      }
      if (control_type) {
        motorPowerProducts = motorPowerProducts.filter(p => p.control_type === control_type);
      }
      const motorPowers = [...new Set(motorPowerProducts.map(p => parseFloat(p.motor_power)).filter(Boolean))];
      availableOptions.motor_power = motorPowers.sort((a, b) => a - b);
      
      // Для шкафов управления inputs_count всегда "1"
      availableOptions.inputs_count = ['1'];
      availableOptions.poles_count = [];
      availableOptions.nominal_current = [];
    } else if (commutation_type === 'contactors') {
      // Для контакторов используем poles_count
      let polesProducts = data.products.filter(p => p.commutation_type === 'contactors');
      if (manufacturer_brand) {
        polesProducts = polesProducts.filter(p => p.brand === manufacturer_brand);
      }
      const polesCounts = [...new Set(polesProducts.map(p => p.poles_count).filter(Boolean))];
      availableOptions.poles_count = polesCounts.sort();
      // Для контакторов inputs_count не используется
      availableOptions.inputs_count = [];
      
      // Номинальный ток для контакторов
      let currentProducts = data.products.filter(p => p.commutation_type === 'contactors');
      if (manufacturer_brand) {
        currentProducts = currentProducts.filter(p => p.brand === manufacturer_brand);
      }
      if (poles_count) {
        currentProducts = currentProducts.filter(p => p.poles_count === poles_count);
      }
      const nominalCurrents = [...new Set(currentProducts.map(p => parseInt(p.nominal_current)).filter(Boolean))];
      availableOptions.nominal_current = nominalCurrents.sort((a, b) => a - b);
    } else if (commutation_type === 'reactive_power') {
      // Для реактивной мощности добавляем regulation_type, reactive_power и steps
      let regulationTypeProducts = data.products.filter(p => p.commutation_type === 'reactive_power');
      if (manufacturer_brand) {
        regulationTypeProducts = regulationTypeProducts.filter(p => p.brand === manufacturer_brand);
      }
      const regulationTypes = [...new Set(regulationTypeProducts.map(p => p.regulation_type).filter(Boolean))];
      availableOptions.regulation_type = regulationTypes.sort();

      // Мощность (с учетом бренда и типа регулирования)
      let reactivePowerProducts = data.products.filter(p => p.commutation_type === 'reactive_power');
      if (manufacturer_brand) {
        reactivePowerProducts = reactivePowerProducts.filter(p => p.brand === manufacturer_brand);
      }
      if (regulation_type) {
        reactivePowerProducts = reactivePowerProducts.filter(p => p.regulation_type === regulation_type);
      }
      const reactivePowers = [...new Set(reactivePowerProducts.map(p => parseFloat(p.power)).filter(Boolean))];
      availableOptions.reactive_power = reactivePowers.sort((a, b) => a - b);
      
      // Ступени (с учетом бренда, типа регулирования и мощности)
      const { reactive_power } = filters;
      let stepsProducts = data.products.filter(p => p.commutation_type === 'reactive_power');
      if (manufacturer_brand) {
        stepsProducts = stepsProducts.filter(p => p.brand === manufacturer_brand);
      }
      if (regulation_type) {
        stepsProducts = stepsProducts.filter(p => p.regulation_type === regulation_type);
      }
      if (reactive_power) {
        stepsProducts = stepsProducts.filter(p => parseFloat(p.power) === parseFloat(reactive_power));
      }
      const steps = [...new Set(stepsProducts.map(p => parseInt(p.step)).filter(Boolean))];
      availableOptions.steps = steps.sort((a, b) => a - b);
      
      // Для реактивной мощности не используются эти параметры
      availableOptions.inputs_count = [];
      availableOptions.poles_count = [];
      availableOptions.nominal_current = [];
    } else {
      // Для АВР используем inputs_count
      let inputsProducts = data.products;
      if (manufacturer_brand) {
        inputsProducts = inputsProducts.filter(p => p.brand === manufacturer_brand);
      }
      if (commutation_type) {
        inputsProducts = inputsProducts.filter(p => p.commutation_type === commutation_type);
      }
      const inputsCounts = [...new Set(inputsProducts.map(p => p.inputs_count).filter(Boolean))];
      availableOptions.inputs_count = inputsCounts.sort((a, b) => String(a).localeCompare(String(b)));
      // Для не-контакторов poles_count не используется
      availableOptions.poles_count = [];
      
      // Номинальный ток для АВР (с учетом всех фильтров)
      let currentProducts = data.products;
      if (manufacturer_brand) {
        currentProducts = currentProducts.filter(p => p.brand === manufacturer_brand);
      }
      if (commutation_type) {
        currentProducts = currentProducts.filter(p => p.commutation_type === commutation_type);
      }
      if (inputs_count) {
        currentProducts = currentProducts.filter(p => p.inputs_count === inputs_count);
      }
      const nominalCurrents = [...new Set(currentProducts.map(p => parseInt(p.nominal_current)).filter(Boolean))];
      availableOptions.nominal_current = nominalCurrents.sort((a, b) => a - b);
    }

    return {
      success: true,
      available_options: availableOptions
    };
  }

  async getProduct(filters) {
    const data = await this.loadProducts();
    
    // Если передан ID, ищем по ID
    if (filters.id) {
      const foundProduct = data.products.find(product => product.id === parseInt(filters.id));
      
      if (!foundProduct) {
        return {
          success: false,
          message: 'Товар не найден'
        };
      }

      // Формируем ответ для поиска по ID
      let images = [];
      if (foundProduct.images && Array.isArray(foundProduct.images) && foundProduct.images.length > 0) {
        images = foundProduct.images.map(img => this.addImageVersion(img));
      } else if (foundProduct.main_image) {
        images = [this.addImageVersion(foundProduct.main_image)];
      }

      const documentation = foundProduct.documentation && Array.isArray(foundProduct.documentation)
        ? foundProduct.documentation
        : [];

      const specs = foundProduct.specs && typeof foundProduct.specs === 'object'
        ? foundProduct.specs
        : {};

      return {
        success: true,
        product: {
          id: foundProduct.id || null,
          article: foundProduct.article || '',
          nominal_current: parseInt(foundProduct.nominal_current || 0),
          commutation_type: foundProduct.commutation_type || null,
          manufacturer_brand: foundProduct.brand || null,
          inputs_count: foundProduct.inputs_count || null,
          poles_count: foundProduct.poles_count || null,
          motor_power: foundProduct.motor_power || null,
          control_type: foundProduct.control_type || null,
          start_type: foundProduct.start_type || null,
          pump_count: foundProduct.pump_count || null,
          regulation_type: foundProduct.regulation_type || null,
          reactive_power: foundProduct.power || null,
          step: foundProduct.step || null,
          box_type: foundProduct.box_type || null,
          motor_control_type: foundProduct.motor_control_type || null,
          feeder_type: foundProduct.feeder_type || null,
          base_price: parseInt(foundProduct.base_price || 0),
          main_image: this.addImageVersion(foundProduct.main_image) || (images[0] || null),
          images: images,
          description: foundProduct.description || '',
          full_description: foundProduct.full_description || foundProduct.description || '',
          documentation: documentation,
          specs: specs
        }
      };
    }
    
    // Иначе ищем по фильтрам
    const { nominal_current, commutation_type, manufacturer_brand, inputs_count, poles_count, motor_power, control_type, regulation_type, reactive_power } = filters;

    // Для шкафов управления требуется motor_power, для реактивной мощности - reactive_power, для остальных - nominal_current
    if (commutation_type === 'control_cabinet') {
      if (!motor_power) {
        throw new Error('motor_power parameter is required for control cabinets');
      }
    } else if (commutation_type === 'reactive_power') {
      if (!reactive_power) {
        throw new Error('reactive_power parameter is required for reactive power products');
      }
    } else {
      if (!nominal_current) {
        throw new Error('nominal_current parameter is required');
      }
    }

    // Ищем подходящий продукт
    const foundProduct = data.products.find(product => {
      if (commutation_type === 'control_cabinet') {
        // Для шкафов управления проверяем motor_power
        if (!product.motor_power || parseFloat(product.motor_power) !== parseFloat(motor_power)) {
          return false;
        }
        if (control_type && product.control_type !== control_type) {
          return false;
        }
      } else if (commutation_type === 'reactive_power') {
        // Для реактивной мощности проверяем power, regulation_type и step
        if (!product.power || parseFloat(product.power) !== parseFloat(reactive_power)) {
          return false;
        }
        if (regulation_type && product.regulation_type !== regulation_type) {
          return false;
        }
        // Проверяем ступени если указаны
        const { step } = filters;
        if (step && product.step && parseInt(product.step) !== parseInt(step)) {
          return false;
        }
      } else {
        // Для АВР проверяем nominal_current
        if (!product.nominal_current || parseInt(product.nominal_current) !== parseInt(nominal_current)) {
          return false;
        }
      }
      
      if (commutation_type && product.commutation_type !== commutation_type) {
        return false;
      }
      if (manufacturer_brand && product.brand !== manufacturer_brand) {
        return false;
      }
      if (inputs_count && product.inputs_count !== inputs_count) {
        return false;
      }
      if (poles_count && product.poles_count !== poles_count) {
        return false;
      }
      return true;
    });

    if (!foundProduct) {
      return {
        success: false,
        message: 'Товар не найден'
      };
    }

    // Формируем ответ в том же формате, что и PHP API
    // Формируем массив изображений: приоритет у массива images, иначе используем main_image
    let images = [];
    if (foundProduct.images && Array.isArray(foundProduct.images) && foundProduct.images.length > 0) {
      images = foundProduct.images.map(img => this.addImageVersion(img));
    } else if (foundProduct.main_image) {
      images = [this.addImageVersion(foundProduct.main_image)];
    }

    const documentation = foundProduct.documentation && Array.isArray(foundProduct.documentation)
      ? foundProduct.documentation
      : [];

    const specs = foundProduct.specs && typeof foundProduct.specs === 'object'
      ? foundProduct.specs
      : {};

    return {
      success: true,
      product: {
        id: foundProduct.id || null,
        article: foundProduct.article || '',
        nominal_current: parseInt(foundProduct.nominal_current || 0),
        commutation_type: foundProduct.commutation_type || null,
        manufacturer_brand: foundProduct.brand || null,
        inputs_count: foundProduct.inputs_count || null,
        poles_count: foundProduct.poles_count || null,
        motor_power: foundProduct.motor_power || null,
        control_type: foundProduct.control_type || null,
        regulation_type: foundProduct.regulation_type || null,
        reactive_power: foundProduct.power || null,
        step: foundProduct.step || null,
        base_price: parseInt(foundProduct.base_price || 0),
        main_image: this.addImageVersion(foundProduct.main_image) || (images[0] || null),
        images: images,
        description: foundProduct.description || '',
        full_description: foundProduct.full_description || foundProduct.description || '',
        documentation: documentation,
        specs: specs
      }
    };
  }
}

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductsAPI;
}
