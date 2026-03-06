const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Мок-сервис для тестирования платежей без реального API банка
 */
class MockPaymentService {
  constructor() {
    this.paymentTimeout = parseInt(process.env.PAYMENT_TIMEOUT_MINUTES) || 15;
    this.mockPayments = new Map(); // Хранилище для симуляции платежей
  }

  /**
   * Создает тестовую платежную сессию
   */
  async createPaymentSession(orderData) {
    try {
      console.log('🧪 ТЕСТОВЫЙ РЕЖИМ: Создание мок-платежа');
      
      // Генерируем тестовые ID
      const timestamp = Date.now();
      const paymentId = `pm_test_${timestamp}`;
      const sessionId = `ps_test_${timestamp}`;
      const orderId = `order-${timestamp}`;
      
      // Создаем тестовый URL для QR-кода
      const qrContent = `https://test.sbp.ru/pay?amount=${orderData.totalPrice}&order=${orderId}`;
      
      // Генерируем QR-код
      const qrImage = await QRCode.toDataURL(qrContent, {
        width: 300,
        margin: 2
      });

      const expiresAt = new Date(Date.now() + this.paymentTimeout * 60 * 1000).toISOString();

      // Сохраняем платежную сессию
      const paymentSession = {
        paymentId,
        sessionId,
        orderId,
        status: 'pending',
        amount: orderData.totalPrice,
        currency: 'RUB',
        clientType: orderData.clientType,
        clientInfo: orderData.clientInfo,
        qrCode: {
          content: qrContent,
          image: qrImage
        },
        createdAt: new Date().toISOString(),
        expiresAt,
        paidAt: null,
        transactionId: null,
        orderData: {
          items: orderData.items,
          totalItems: orderData.totalItems,
          totalPrice: orderData.totalPrice
        },
        isMock: true // Флаг тестового платежа
      };

      await this.savePaymentSession(paymentSession);
      
      // Сохраняем в памяти для симуляции
      this.mockPayments.set(paymentId, paymentSession);

      console.log(`✅ Тестовый платеж создан: ${paymentId}`);
      console.log(`💡 Для симуляции оплаты используйте: POST /api/payments/mock-pay/${paymentId}`);

      return {
        success: true,
        paymentId,
        sessionId,
        qrCode: {
          content: qrContent,
          image: qrImage
        },
        expiresAt,
        amount: orderData.totalPrice,
        isMock: true
      };

    } catch (error) {
      console.error('Ошибка создания тестового платежа:', error.message);
      throw new Error(`Не удалось создать тестовый платеж: ${error.message}`);
    }
  }

  /**
   * Симулирует успешную оплату (для тестирования)
   */
  async mockPaymentSuccess(paymentId) {
    try {
      const payment = await this.getPaymentStatus(paymentId);
      
      if (payment.status !== 'pending') {
        throw new Error(`Платеж уже обработан. Статус: ${payment.status}`);
      }

      const updates = {
        status: 'succeeded',
        paidAt: new Date().toISOString(),
        transactionId: `mock_tx_${Date.now()}`
      };

      await this.updatePaymentStatus(paymentId, updates);
      
      console.log(`✅ Тестовый платеж успешно оплачен: ${paymentId}`);
      
      return { success: true, message: 'Mock payment succeeded' };
    } catch (error) {
      console.error('Ошибка симуляции оплаты:', error);
      throw error;
    }
  }

  /**
   * Симулирует отклонение платежа (для тестирования)
   */
  async mockPaymentFailure(paymentId) {
    try {
      const payment = await this.getPaymentStatus(paymentId);
      
      if (payment.status !== 'pending') {
        throw new Error(`Платеж уже обработан. Статус: ${payment.status}`);
      }

      const updates = {
        status: 'failed',
        paidAt: new Date().toISOString()
      };

      await this.updatePaymentStatus(paymentId, updates);
      
      console.log(`❌ Тестовый платеж отклонен: ${paymentId}`);
      
      return { success: true, message: 'Mock payment failed' };
    } catch (error) {
      console.error('Ошибка симуляции отклонения:', error);
      throw error;
    }
  }

  /**
   * Сохраняет платежную сессию в файл
   */
  async savePaymentSession(paymentSession) {
    const filePath = path.join(__dirname, 'history', `payment-${paymentSession.paymentId}.json`);
    await fs.writeFile(filePath, JSON.stringify(paymentSession, null, 2), 'utf8');
  }

  /**
   * Получает статус платежа из файла
   */
  async getPaymentStatus(paymentId) {
    try {
      const filePath = path.join(__dirname, 'history', `payment-${paymentId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Платеж не найден: ${paymentId}`);
    }
  }

  /**
   * Обновляет статус платежа
   */
  async updatePaymentStatus(paymentId, updates) {
    const payment = await this.getPaymentStatus(paymentId);
    const updatedPayment = { ...payment, ...updates };
    await this.savePaymentSession(updatedPayment);
    return updatedPayment;
  }

  /**
   * Валидирует подпись вебхука (всегда true для мок-режима)
   */
  validateWebhookSignature(payload, signature) {
    console.log('🧪 ТЕСТОВЫЙ РЕЖИМ: Пропуск валидации подписи');
    return true;
  }
}

module.exports = new MockPaymentService();
