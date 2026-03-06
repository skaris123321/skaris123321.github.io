/**
 * Alpine.js компонент для обработки оплаты через СБП
 */

// Состояния оплаты
const PAYMENT_STATES = {
  LOADING: 'loading',
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  EXPIRED: 'expired'
};

/**
 * Создает компонент оплаты для Alpine.js
 * @param {Object} orderData - Данные заказа
 * @returns {Object} - Alpine.js компонент
 */
function createPaymentComponent(orderData) {
  return {
    // Состояние
    paymentState: PAYMENT_STATES.LOADING,
    paymentId: null,
    sessionId: null,
    qrCodeImage: null,
    expiresAt: null,
    amount: 0,
    
    // Таймер
    timeRemaining: 0,
    timerInterval: null,
    
    // Polling
    pollingInterval: null,
    pollingAttempts: 0,
    maxPollingAttempts: 300, // 15 минут * 60 секунд / 3 секунды
    
    // Данные заказа
    orderData: orderData,

    /**
     * Инициализация компонента
     */
    async init() {
      await this.initPayment();
    },

    /**
     * Инициализирует платеж
     */
    async initPayment() {
      try {
        this.paymentState = PAYMENT_STATES.LOADING;

        // Создаем платежную сессию
        const response = await fetch('/api/payments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderData: this.orderData
          })
        });

        if (!response.ok) {
          throw new Error('Не удалось создать платежную сессию');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Ошибка создания платежа');
        }

        // Сохраняем данные платежа
        this.paymentId = data.paymentId;
        this.sessionId = data.sessionId;
        this.qrCodeImage = data.qrCode.image;
        this.expiresAt = new Date(data.expiresAt);
        this.amount = data.amount;

        // Отображаем QR-код
        this.displayQRCode();

        // Переходим в состояние ожидания
        this.paymentState = PAYMENT_STATES.PENDING;

        // Запускаем таймер и polling
        this.startTimer();
        this.startPolling();

      } catch (error) {
        console.error('Ошибка инициализации платежа:', error);
        this.paymentState = PAYMENT_STATES.FAILED;
        this.showError('Не удалось создать платеж. Попробуйте еще раз.');
      }
    },

    /**
     * Отображает QR-код
     */
    displayQRCode() {
      const qrcodeDiv = document.getElementById('qrcode');
      if (qrcodeDiv && this.qrCodeImage) {
        qrcodeDiv.innerHTML = `<img src="${this.qrCodeImage}" alt="QR-код для оплаты" style="width: 100%; height: auto;">`;
      }
    },

    /**
     * Запускает таймер обратного отсчета
     */
    startTimer() {
      // Вычисляем оставшееся время
      this.updateTimeRemaining();

      // Обновляем каждую секунду
      this.timerInterval = setInterval(() => {
        this.updateTimeRemaining();

        if (this.timeRemaining <= 0) {
          this.handleTimeout();
        }
      }, 1000);
    },

    /**
     * Обновляет оставшееся время
     */
    updateTimeRemaining() {
      const now = new Date();
      const diff = this.expiresAt - now;
      this.timeRemaining = Math.max(0, Math.floor(diff / 1000));
    },

    /**
     * Форматирует оставшееся время в MM:SS
     */
    get formattedTime() {
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    /**
     * Обрабатывает истечение времени
     */
    handleTimeout() {
      this.stopTimer();
      this.stopPolling();
      this.paymentState = PAYMENT_STATES.EXPIRED;
      console.log('⏱️  Время оплаты истекло');
    },

    /**
     * Останавливает таймер
     */
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },

    /**
     * Запускает polling статуса платежа
     */
    startPolling() {
      const pollInterval = parseInt(process.env.PAYMENT_POLL_INTERVAL_SECONDS || 3) * 1000;

      this.pollingInterval = setInterval(async () => {
        await this.checkPaymentStatus();
        this.pollingAttempts++;

        // Останавливаем polling если превышено максимальное количество попыток
        if (this.pollingAttempts >= this.maxPollingAttempts) {
          this.stopPolling();
        }
      }, pollInterval);
    },

    /**
     * Проверяет статус платежа
     */
    async checkPaymentStatus() {
      try {
        const response = await fetch(`/api/payments/status/${this.paymentId}`);

        if (!response.ok) {
          throw new Error('Не удалось проверить статус платежа');
        }

        const data = await response.json();

        if (data.status === 'succeeded') {
          this.handlePaymentSuccess(data);
        } else if (data.status === 'failed') {
          this.handlePaymentError('Платеж отклонен банком');
        } else if (data.status === 'expired') {
          this.handleTimeout();
        }

      } catch (error) {
        console.error('Ошибка проверки статуса:', error);
        // Не показываем ошибку пользователю, просто продолжаем polling
      }
    },

    /**
     * Останавливает polling
     */
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },

    /**
     * Обрабатывает успешную оплату
     */
    handlePaymentSuccess(paymentData) {
      this.stopTimer();
      this.stopPolling();
      this.paymentState = PAYMENT_STATES.SUCCESS;

      console.log('✅ Оплата подтверждена:', paymentData);

      // Показываем сообщение об успехе
      setTimeout(() => {
        this.showSuccessMessage();
      }, 500);
    },

    /**
     * Обрабатывает ошибку оплаты
     */
    handlePaymentError(message) {
      this.stopTimer();
      this.stopPolling();
      this.paymentState = PAYMENT_STATES.FAILED;
      this.showError(message);
    },

    /**
     * Показывает сообщение об успехе
     */
    showSuccessMessage() {
      if (window.cartData && typeof window.cartData.showModal === 'function') {
        window.cartData.showModal({
          type: 'success',
          title: 'Оплата подтверждена!',
          message: 'Ваш заказ успешно оплачен и отправлен в обработку. Мы свяжемся с вами в ближайшее время.',
          showCancel: false,
          confirmText: 'OK',
          onConfirm: () => {
            // Очищаем корзину
            if (window.cart) {
              window.cart.clear();
            }
            // Перенаправляем на главную
            window.location.href = '../index.html';
          }
        });
      }
    },

    /**
     * Показывает ошибку
     */
    showError(message) {
      if (window.cartData && typeof window.cartData.showModal === 'function') {
        window.cartData.showModal({
          type: 'warning',
          title: 'Ошибка оплаты',
          message: message + '\n\nСвяжитесь с нами по телефону 8 (800) 55-11-052',
          showCancel: false,
          confirmText: 'OK'
        });
      }
    },

    /**
     * Перегенерирует QR-код
     */
    async regenerateQR() {
      this.stopTimer();
      this.stopPolling();
      this.pollingAttempts = 0;
      await this.initPayment();
    },

    /**
     * Закрывает модальное окно оплаты
     */
    closePaymentModal() {
      this.stopTimer();
      this.stopPolling();
      
      if (window.cartData) {
        window.cartData.showPaymentModal = false;
      }
    },

    /**
     * Очистка при уничтожении компонента
     */
    destroy() {
      this.stopTimer();
      this.stopPolling();
    }
  };
}

// Экспортируем для использования в Alpine.js
if (typeof window !== 'undefined') {
  window.createPaymentComponent = createPaymentComponent;
  window.PAYMENT_STATES = PAYMENT_STATES;
}
