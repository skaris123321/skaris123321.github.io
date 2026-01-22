/**
 * Логика для страницы однофазных АВР на контакторах
 */

function singlePhaseAVRApp() {
  return {
    // Доступные опции
    availableOptions: {
      manufacturer_brand: ['CHINT', 'EKF', 'Dekraft', 'IEK', 'TDM'],
      nominal_current: [12, 16, 20, 25, 32, 40, 50, 63]
    },

    // Выбранные параметры
    selectedBrand: '',
    selectedCurrent: '',
    selectedEnclosure: '',
    selectedConnection: 'poles', // по умолчанию к полюсам
    selectedClimate: '',

    // Цены
    basePrice: 0,
    connectionAddon: 0,
    climateAddon: 0,

    // Вычисляемые свойства
    get totalPrice() {
      return this.basePrice + this.connectionAddon + this.climateAddon;
    },

    get isConfigurationComplete() {
      return this.selectedBrand && 
             this.selectedCurrent && 
             this.selectedEnclosure && 
             this.selectedConnection && 
             this.selectedClimate;
    },

    // Инициализация
    init() {
      console.log('Single Phase AVR App initialized');
    },

    // Выбор бренда
    selectBrand(brand) {
      this.selectedBrand = brand;
      this.updatePrice();
    },

    // Выбор тока
    selectCurrent(current) {
      this.selectedCurrent = current;
      this.updatePrice();
    },

    // Выбор корпуса
    selectEnclosure(enclosure) {
      this.selectedEnclosure = enclosure;
      
      // Если выбран не 19", сбрасываем климатическое исполнение УХЛ4
      if (enclosure !== '19inch' && this.selectedClimate === 'UHL4') {
        this.selectedClimate = '';
      }
      
      // Если выбран навесной, автоматически ставим У2
      if (enclosure === 'wall') {
        this.selectedClimate = 'U2';
      }
      
      this.updatePrice();
    },

    // Выбор подключения
    selectConnection(connection) {
      this.selectedConnection = connection;
      this.updatePrice();
    },

    // Выбор климатического исполнения
    selectClimate(climate) {
      // УХЛ4 доступно только для 19"
      if (climate === 'UHL4' && this.selectedEnclosure !== '19inch') {
        return;
      }
      
      this.selectedClimate = climate;
      this.updatePrice();
    },

    // Обновление цены
    updatePrice() {
      // Базовая цена зависит от бренда и тока
      this.calculateBasePrice();
      
      // Доплата за дополнительные клеммы
      this.connectionAddon = this.selectedConnection === 'terminals' ? 1000 : 0;
      
      // Доплата за уличное исполнение
      this.climateAddon = this.selectedClimate === 'U2' ? 23000 : 0;
    },

    // Расчет базовой цены
    calculateBasePrice() {
      if (!this.selectedBrand || !this.selectedCurrent) {
        this.basePrice = 0;
        return;
      }

      // Базовые цены по брендам и токам (примерные)
      const basePrices = {
        'CHINT': {
          12: 15000, 16: 16000, 20: 17000, 25: 18000,
          32: 20000, 40: 22000, 50: 25000, 63: 28000
        },
        'EKF': {
          12: 14000, 16: 15000, 20: 16000, 25: 17000,
          32: 19000, 40: 21000, 50: 24000, 63: 27000
        },
        'Dekraft': {
          12: 13000, 16: 14000, 20: 15000, 25: 16000,
          32: 18000, 40: 20000, 50: 23000, 63: 26000
        },
        'IEK': {
          12: 16000, 16: 17000, 20: 18000, 25: 19000,
          32: 21000, 40: 23000, 50: 26000, 63: 29000
        },
        'TDM': {
          12: 12000, 16: 13000, 20: 14000, 25: 15000,
          32: 17000, 40: 19000, 50: 22000, 63: 25000
        }
      };

      this.basePrice = basePrices[this.selectedBrand]?.[this.selectedCurrent] || 0;
    },

    // Форматирование цены
    formatPrice(price) {
      return new Intl.NumberFormat('ru-RU').format(price);
    },

    // Получение текста для корпуса
    getEnclosureText(enclosure) {
      const texts = {
        '19inch': '19 дюймов',
        'wall': 'Навесной'
      };
      return texts[enclosure] || '';
    },

    // Получение текста для подключения
    getConnectionText(connection) {
      const texts = {
        'poles': 'К полюсам автомата',
        'terminals': 'На дополнительные клеммы (+1 000 ₽)'
      };
      return texts[connection] || '';
    },

    // Получение текста для климатического исполнения
    getClimateText(climate) {
      const texts = {
        'UHL4': 'УХЛ4 - сухие теплые помещения',
        'U2': 'У2 - уличное с обогревом (+23 000 ₽)'
      };
      return texts[climate] || '';
    },

    // Добавление в корзину
    addToCart() {
      if (!this.isConfigurationComplete) {
        alert('Пожалуйста, выберите все параметры');
        return;
      }

      const product = {
        id: `single-phase-${Date.now()}`,
        name: `Однофазный АВР ${this.selectedBrand} ${this.selectedCurrent}А`,
        brand: this.selectedBrand,
        current: this.selectedCurrent,
        enclosure: this.selectedEnclosure,
        connection: this.selectedConnection,
        climate: this.selectedClimate,
        price: this.totalPrice,
        category: 'single-phase-avr',
        description: `Однофазный АВР на контакторах ${this.selectedBrand} ${this.selectedCurrent}А, ${this.getEnclosureText(this.selectedEnclosure)}, ${this.getClimateText(this.selectedClimate)}`
      };

      // Добавляем в корзину (используем функцию из cart.js)
      if (typeof addToCart === 'function') {
        addToCart(product);
        alert('Товар добавлен в корзину!');
      } else {
        console.log('Product to add to cart:', product);
        alert('Товар добавлен в корзину! (функция корзины не найдена)');
      }
    },

    // Запрос коммерческого предложения
    requestQuote() {
      if (!this.isConfigurationComplete) {
        alert('Пожалуйста, выберите все параметры');
        return;
      }

      const config = {
        brand: this.selectedBrand,
        current: this.selectedCurrent,
        enclosure: this.getEnclosureText(this.selectedEnclosure),
        connection: this.getConnectionText(this.selectedConnection),
        climate: this.getClimateText(this.selectedClimate),
        totalPrice: this.totalPrice
      };

      // Формируем текст для отправки
      const message = `Запрос КП на однофазный АВР:
Бренд: ${config.brand}
Ток: ${config.current}А
Корпус: ${config.enclosure}
Подключение: ${config.connection}
Климатическое исполнение: ${config.climate}
Итоговая цена: ${this.formatPrice(config.totalPrice)} ₽`;

      // Можно отправить на email или показать модальное окно
      console.log('Quote request:', message);
      alert('Запрос на коммерческое предложение отправлен!\n\n' + message);
    }
  };
}