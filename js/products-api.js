// API для работы с товарами
class ProductsAPI {
  constructor() {
    this.productsData = null;
    this.loadPromise = null;
    this.categoryCache = {};
    this.imageVersion = '5';

    // Переключатель: 'json' = читать из файлов, 'php' = читать из базы данных
    // Поменяй на 'php' когда настроишь хостинг с MySQL
    this.mode = 'json';
    this.apiBase = '/api';
  }

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

    this.loadPromise = (async () => {
      try {
        // Загружаем индексный файл
        const indexResponse = await fetch('../data/products-index.json?v=2&t=' + Date.now(), {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (!indexResponse.ok) {
          throw new Error(`Failed to load products-index.json: ${indexResponse.status}`);
        }

        const index = await indexResponse.json();
        
        const categoryPromises = Object.entries(index.categories).map(async ([key, info]) => {
          const response = await fetch(`../data/${info.file}?v=2&t=` + Date.now(), {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            }
          });
          
          if (!response.ok) {
            console.warn(`Failed to load ${info.file}: ${response.status}`);
            return [];
          }
          
          const data = await response.json();
          return data.products || [];
        });

        const categoryResults = await Promise.all(categoryPromises);
        const allProducts = categoryResults.flat();
        
        this.productsData = { products: allProducts };
        
        return this.productsData;
      } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        this.loadPromise = null;
        throw error;
      }
    })();

    return this.loadPromise;
  }

  async loadCategory(categoryName) {
    if (this.categoryCache[categoryName]) {
      return this.categoryCache[categoryName];
    }

    try {
      const fileName = `products-${categoryName}.json`;
      const response = await fetch(`../data/${fileName}?v=2&t=` + Date.now(), {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load ${fileName}: ${response.status}`);
      }

      const data = await response.json();
      this.categoryCache[categoryName] = data;
      
      return data;
    } catch (error) {
      console.error(`Ошибка загрузки категории ${categoryName}:`, error);
      throw error;
    }
  }

  async getAvailableOptions(filters = {}) {
    const data = await this.loadProducts();
    const { manufacturer_brand, commutation_type, inputs_count, poles_count, control_type, motor_power, regulation_type } = filters;

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
      steps: [],
      feeder_type: [],
      box_type: [],
      reversible: []
    };

    let brandProducts = data.products;
    if (commutation_type) {
      brandProducts = brandProducts.filter(p => p.commutation_type === commutation_type);
      
      if (commutation_type === 'motor_control_box') {
        const allowedBrands = ['IEK', 'TDM', 'EKF'];
        const allBrands = [...new Set(brandProducts.map(p => p.brand).filter(b => allowedBrands.includes(b)))];
        availableOptions.manufacturer_brand = allBrands.sort();
      } else {
        const allBrands = [...new Set(brandProducts.map(p => p.brand).filter(Boolean))];
        availableOptions.manufacturer_brand = allBrands.sort();
      }
    } else {
      const allBrands = [...new Set(data.products.map(p => p.brand).filter(Boolean))];
      availableOptions.manufacturer_brand = allBrands.sort();
    }

    let typeProducts = data.products;
    if (manufacturer_brand) {
      typeProducts = typeProducts.filter(p => p.brand === manufacturer_brand);
    }
    const commutationTypes = [...new Set(typeProducts.map(p => p.commutation_type).filter(Boolean))];
    availableOptions.commutation_type = commutationTypes.sort();

    if (commutation_type === 'control_cabinet') {
      let controlTypeProducts = data.products.filter(p => p.commutation_type === 'control_cabinet');
      if (manufacturer_brand) {
        controlTypeProducts = controlTypeProducts.filter(p => p.brand === manufacturer_brand);
      }
      const controlTypes = [...new Set(controlTypeProducts.map(p => p.control_type).filter(Boolean))];
      availableOptions.control_type = controlTypes.sort();

      let motorPowerProducts = data.products.filter(p => p.commutation_type === 'control_cabinet');
      if (manufacturer_brand) {
        motorPowerProducts = motorPowerProducts.filter(p => p.brand === manufacturer_brand);
      }
      if (control_type) {
        motorPowerProducts = motorPowerProducts.filter(p => p.control_type === control_type);
      }
      const motorPowers = [...new Set(motorPowerProducts.map(p => parseFloat(p.motor_power)).filter(Boolean))];
      availableOptions.motor_power = motorPowers.sort((a, b) => a - b);
      
      availableOptions.inputs_count = ['1'];
      availableOptions.poles_count = [];
      availableOptions.nominal_current = [];
    } else if (commutation_type === 'contactors') {
      let polesProducts = data.products.filter(p => p.commutation_type === 'contactors');
      if (manufacturer_brand) {
        polesProducts = polesProducts.filter(p => p.brand === manufacturer_brand);
      }
      const polesCounts = [...new Set(polesProducts.map(p => p.poles_count).filter(Boolean))];
      availableOptions.poles_count = polesCounts.sort();
      availableOptions.inputs_count = [];
      
      let currentProducts = data.products.filter(p => p.commutation_type === 'contactors');
      if (manufacturer_brand) {
        currentProducts = currentProducts.filter(p => p.brand === manufacturer_brand);
      }
      if (poles_count) {
        currentProducts = currentProducts.filter(p => p.poles_count === poles_count);
      }
      const nominalCurrents = [...new Set(currentProducts.map(p => parseFloat(p.nominal_current)).filter(Boolean))];
      availableOptions.nominal_current = nominalCurrents.sort((a, b) => a - b);
    } else if (commutation_type === 'reactive_power') {
      let regulationTypeProducts = data.products.filter(p => p.commutation_type === 'reactive_power');
      if (manufacturer_brand) {
        regulationTypeProducts = regulationTypeProducts.filter(p => p.brand === manufacturer_brand);
      }
      const regulationTypes = [...new Set(regulationTypeProducts.map(p => p.regulation_type).filter(Boolean))];
      availableOptions.regulation_type = regulationTypes.sort();

      let reactivePowerProducts = data.products.filter(p => p.commutation_type === 'reactive_power');
      if (manufacturer_brand) {
        reactivePowerProducts = reactivePowerProducts.filter(p => p.brand === manufacturer_brand);
      }
      if (regulation_type) {
        reactivePowerProducts = reactivePowerProducts.filter(p => p.regulation_type === regulation_type);
      }
      const reactivePowers = [...new Set(reactivePowerProducts.map(p => parseFloat(p.power)).filter(Boolean))];
      availableOptions.reactive_power = reactivePowers.sort((a, b) => a - b);
      
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
      
      availableOptions.inputs_count = [];
      availableOptions.poles_count = [];
      availableOptions.nominal_current = [];
    } else if (commutation_type === 'motor_control_box') {
      const { box_type, reversible } = filters;
      
      let boxTypeProducts = data.products.filter(p => p.commutation_type === 'motor_control_box');
      if (manufacturer_brand) {
        boxTypeProducts = boxTypeProducts.filter(p => p.brand === manufacturer_brand);
      }
      const boxTypes = [...new Set(boxTypeProducts.map(p => p.box_type).filter(Boolean))];
      availableOptions.box_type = boxTypes.sort();
      
      let reversibleProducts = data.products.filter(p => p.commutation_type === 'motor_control_box');
      if (manufacturer_brand) {
        reversibleProducts = reversibleProducts.filter(p => p.brand === manufacturer_brand);
      }
      if (box_type) {
        reversibleProducts = reversibleProducts.filter(p => p.box_type === box_type);
      }
      const reversibleValues = [...new Set(reversibleProducts.map(p => p.reversible).filter(v => v !== undefined && v !== null))];
      availableOptions.reversible = reversibleValues.sort();
      
      let currentProducts = data.products.filter(p => p.commutation_type === 'motor_control_box');
      if (manufacturer_brand) {
        currentProducts = currentProducts.filter(p => p.brand === manufacturer_brand);
      }
      if (box_type) {
        currentProducts = currentProducts.filter(p => p.box_type === box_type);
      }
      if (reversible !== undefined) {
        currentProducts = currentProducts.filter(p => p.reversible === reversible);
      }
      const nominalCurrents = [...new Set(currentProducts.map(p => parseFloat(p.nominal_current)).filter(Boolean))];
      availableOptions.nominal_current = nominalCurrents.sort((a, b) => a - b);
      
      let feederTypeProducts = data.products.filter(p => p.commutation_type === 'motor_control_box');
      if (manufacturer_brand) {
        feederTypeProducts = feederTypeProducts.filter(p => p.brand === manufacturer_brand);
      }
      if (box_type) {
        feederTypeProducts = feederTypeProducts.filter(p => p.box_type === box_type);
      }
      if (reversible !== undefined) {
        feederTypeProducts = feederTypeProducts.filter(p => p.reversible === reversible);
      }
      const feederTypes = [...new Set(feederTypeProducts.map(p => p.feeder_type).filter(Boolean))];
      availableOptions.feeder_type = feederTypes.sort();
      
      availableOptions.inputs_count = [];
      availableOptions.poles_count = [];
    } else {
      let inputsProducts = data.products;
      if (manufacturer_brand) {
        inputsProducts = inputsProducts.filter(p => p.brand === manufacturer_brand);
      }
      if (commutation_type) {
        inputsProducts = inputsProducts.filter(p => p.commutation_type === commutation_type);
      }
      const inputsCounts = [...new Set(inputsProducts.map(p => p.inputs_count).filter(Boolean))];
      availableOptions.inputs_count = inputsCounts.sort((a, b) => String(a).localeCompare(String(b)));
      availableOptions.poles_count = [];
      
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
      const nominalCurrents = [...new Set(currentProducts.map(p => parseFloat(p.nominal_current)).filter(Boolean))];
      availableOptions.nominal_current = nominalCurrents.sort((a, b) => a - b);
    }

    return {
      success: true,
      available_options: availableOptions
    };
  }

  async getProduct(filters) {
    const data = await this.loadProducts();
    
    if (filters.id) {
      const foundProduct = data.products.find(product => product.id === parseInt(filters.id));
      
      if (!foundProduct) {
        return {
          success: false,
          message: 'Товар не найден'
        };
      }

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
          nominal_current: parseFloat(foundProduct.nominal_current || 0),
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
          reversible: foundProduct.reversible || null,
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

    const foundProduct = data.products.find(product => {
      if (commutation_type === 'control_cabinet') {
        if (!product.motor_power || parseFloat(product.motor_power) !== parseFloat(motor_power)) {
          return false;
        }
        if (control_type && product.control_type !== control_type) {
          return false;
        }
      } else if (commutation_type === 'reactive_power') {
        if (!product.power || parseFloat(product.power) !== parseFloat(reactive_power)) {
          return false;
        }
        if (regulation_type && product.regulation_type !== regulation_type) {
          return false;
        }
        const { step } = filters;
        if (step && product.step && parseInt(product.step) !== parseInt(step)) {
          return false;
        }
      } else if (commutation_type === 'motor_control_box') {
        if (!product.nominal_current || parseFloat(product.nominal_current) !== parseFloat(nominal_current)) {
          return false;
        }
        const { box_type, feeder_type, reversible } = filters;
        if (box_type && product.box_type !== box_type) {
          return false;
        }
        if (feeder_type && product.feeder_type !== feeder_type) {
          return false;
        }
        if (reversible !== undefined && product.reversible !== reversible) {
          return false;
        }
      } else {
        if (!product.nominal_current || parseFloat(product.nominal_current) !== parseFloat(nominal_current)) {
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
        nominal_current: parseFloat(foundProduct.nominal_current || 0),
        commutation_type: foundProduct.commutation_type || null,
        manufacturer_brand: foundProduct.brand || null,
        inputs_count: foundProduct.inputs_count || null,
        poles_count: foundProduct.poles_count || null,
        motor_power: foundProduct.motor_power || null,
        control_type: foundProduct.control_type || null,
        regulation_type: foundProduct.regulation_type || null,
        reactive_power: foundProduct.power || null,
        step: foundProduct.step || null,
        box_type: foundProduct.box_type || null,
        feeder_type: foundProduct.feeder_type || null,
        reversible: foundProduct.reversible || null,
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
