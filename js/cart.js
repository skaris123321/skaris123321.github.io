/**
 * Система управления корзиной
 */

class Cart {
  constructor() {
    this.items = [];
    this.loadFromStorage();
  }

  // Генерируем уникальный ID для товара на основе его характеристик
  generateItemId(product) {
    if (product.commutationType === 'control_cabinet') {
      // Для шкафов управления
      let key = `${product.manufacturerBrand}-${product.commutationType}-${product.controlType}-${product.motorPower}`;
      // Для прямого пуска добавляем тип пуска и количество насосов
      if (product.controlType === 'direct_start') {
        key += `-${product.startType}-${product.pumpCount}`;
      }
      return key;
    } else if (product.commutationType === 'reactive_power') {
      // Для реактивной мощности
      let key = `${product.manufacturerBrand}-${product.commutationType}-${product.regulationType}-${product.reactivePower}`;
      // Для регулируемых установок добавляем количество ступеней
      if (product.regulationType === 'regulated' && product.step) {
        key += `-${product.step}`;
      }
      return key;
    } else if (product.commutationType === 'contactors') {
      // Для контакторов
      return `${product.manufacturerBrand}-${product.commutationType}-${product.nominalCurrent}-${product.polesCount}-${product.cableConnection}-${product.climateVersion}`;
    } else {
      // Для моноблочных АВР
      return `${product.manufacturerBrand}-${product.commutationType}-${product.nominalCurrent}-${product.inputsCount}-${product.cableConnection}-${product.climateVersion}`;
    }
  }

  // Добавляем товар в корзину
  addItem(product, quantity = 1) {
    const itemId = this.generateItemId(product);
    const existingItem = this.items.find(item => item.id === itemId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        id: itemId,
        ...product,
        quantity: quantity,
        addedAt: new Date().toISOString()
      });
    }

    this.saveToStorage();
    this.notifyChange();
    
    // Показываем уведомление - ОТКЛЮЧЕНО, используется модальное окно
    // if (typeof Notification !== 'undefined') {
    //   Notification.toastSuccess(`${product.name} добавлен в корзину!`);
    // }
  }

  // Обновляем количество товара
  updateQuantity(itemId, quantity) {
    const item = this.items.find(item => item.id === itemId);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(itemId);
      } else {
        item.quantity = quantity;
        this.saveToStorage();
        this.notifyChange();
      }
    }
  }

  // Удаляем товар из корзины
  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    this.saveToStorage();
    this.notifyChange();
  }

  // Очищаем корзину
  clear() {
    this.items = [];
    this.saveToStorage();
    this.notifyChange();
  }

  // Получаем все товары в корзине
  getItems() {
    return this.items;
  }

  // Получаем общее количество товаров
  getTotalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Получаем общую стоимость
  getTotalPrice() {
    return this.items.reduce((total, item) => total + (item.totalPrice * item.quantity), 0);
  }

  // Проверяем есть ли товар с такими характеристиками в корзине
  hasItem(product) {
    const itemId = this.generateItemId(product);
    const item = this.items.find(item => item.id === itemId);
    return item ? item.quantity : 0;
  }

  // Сохраняем в localStorage
  saveToStorage() {
    try {
      localStorage.setItem('rosek_cart', JSON.stringify(this.items));
    } catch (error) {
      console.error('Ошибка сохранения корзины:', error);
    }
  }

  // Загружаем из localStorage
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('rosek_cart');
      if (saved) {
        this.items = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
      this.items = [];
    }
  }

  // Уведомляем об изменениях
  notifyChange() {
    // Отправляем событие для обновления UI
    window.dispatchEvent(new CustomEvent('cartChanged', {
      detail: {
        items: this.items,
        totalItems: this.getTotalItems(),
        totalPrice: this.getTotalPrice()
      }
    }));
  }
}

// Создаем глобальный экземпляр корзины
window.cart = new Cart();