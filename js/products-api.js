/**
 * Клиентский API для работы с продуктами
 * Работает напрямую с JSON файлом без необходимости сервера
 */

class ProductsAPI {
  constructor() {
    this.productsData = null;
    this.loadPromise = null;
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
    const { manufacturer_brand, commutation_type, inputs_count, poles_count } = filters;

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

    // Получаем уникальные значения
    const availableOptions = {
      nominal_current: [],
      commutation_type: [],
      manufacturer_brand: [],
      inputs_count: [],
      poles_count: []
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

    // Для контакторов используем poles_count, для остальных - inputs_count
    if (commutation_type === 'contactors') {
      let polesProducts = data.products.filter(p => p.commutation_type === 'contactors');
      if (manufacturer_brand) {
        polesProducts = polesProducts.filter(p => p.brand === manufacturer_brand);
      }
      const polesCounts = [...new Set(polesProducts.map(p => p.poles_count).filter(Boolean))];
      availableOptions.poles_count = polesCounts.sort();
      // Для контакторов inputs_count не используется
      availableOptions.inputs_count = [];
    } else {
      // Количество вводов (с учетом бренда и типа коммутации)
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
    }

    // Номинальный ток (с учетом всех фильтров)
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
    if (poles_count) {
      currentProducts = currentProducts.filter(p => p.poles_count === poles_count);
    }
    const nominalCurrents = [...new Set(currentProducts.map(p => parseInt(p.nominal_current)).filter(Boolean))];
    availableOptions.nominal_current = nominalCurrents.sort((a, b) => a - b);

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
        images = foundProduct.images;
      } else if (foundProduct.main_image) {
        images = [foundProduct.main_image];
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
          nominal_current: parseInt(foundProduct.nominal_current),
          commutation_type: foundProduct.commutation_type || null,
          manufacturer_brand: foundProduct.brand || null,
          inputs_count: foundProduct.inputs_count || null,
          poles_count: foundProduct.poles_count || null,
          base_price: parseInt(foundProduct.base_price || 0),
          main_image: foundProduct.main_image || (images[0] || null),
          images: images,
          description: foundProduct.description || '',
          full_description: foundProduct.full_description || foundProduct.description || '',
          documentation: documentation,
          specs: specs
        }
      };
    }
    
    // Иначе ищем по фильтрам (старая логика)
    const { nominal_current, commutation_type, manufacturer_brand, inputs_count, poles_count } = filters;

    if (!nominal_current) {
      throw new Error('nominal_current parameter is required');
    }

    // Ищем подходящий продукт
    const foundProduct = data.products.find(product => {
      if (!product.nominal_current || parseInt(product.nominal_current) !== parseInt(nominal_current)) {
        return false;
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
      images = foundProduct.images;
    } else if (foundProduct.main_image) {
      images = [foundProduct.main_image];
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
        nominal_current: parseInt(foundProduct.nominal_current),
        commutation_type: foundProduct.commutation_type || null,
        manufacturer_brand: foundProduct.brand || null,
        inputs_count: foundProduct.inputs_count || null,
        poles_count: foundProduct.poles_count || null,
        base_price: parseInt(foundProduct.base_price || 0),
        main_image: foundProduct.main_image || (images[0] || null),
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
