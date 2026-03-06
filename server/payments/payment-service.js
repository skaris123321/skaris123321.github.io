const axios = require('axios');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    this.apiUrl = process.env.SBP_API_URL;
    this.merchantId = process.env.SBP_MERCHANT_ID;
    this.apiKey = process.env.SBP_API_KEY;
    this.webhookSecret = process.env.SBP_WEBHOOK_SECRET;
    this.paymentTimeout = parseInt(process.env.PAYMENT_TIMEOUT_MINUTES) || 15;
  }

  /**
   * Создает платежную сессию через API банка
   * @param {Object} orderData - Данные заказа
   * @returns {Promise<Object>} - Данные платежной сессии
   */
  async createPaymentSession(orderData) {
    try {
      // Генерируем уникальный ID для заказа
      const orderId = `order-${Date.now()}`;
      
      // Формируем запрос к API банка для создания сессии
      const sessionResponse = await axios.post(
        `${this.apiUrl}/session/create`,
        {
          customer: {
            reference: orderId
          },
          payment_details: {
            type: 'faster_payment_system',
            faster_payment_system: {
              description: `Оплата заказа ${orderId}`
            }
          },
          amount_details: {
            amount: Math.round(orderData.totalPrice * 100), // Конвертируем в копейки
            currency: 'RUB'
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const sessionId = sessionResponse.data.session_id;

      // Запускаем платеж для получения QR-кода
      const paymentResponse = await axios.post(
        `${this.apiUrl}/session/start/payment`,
        {
          session_id: sessionId,
          payment_options: {
            return_url: 'https://rosek.tech/category/cart.html',
            recurrent: false
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const paymentId = paymentResponse.data.acquiring_payments[0].id;
      const qrContent = paymentResponse.data.acquiring_payments[0].payment_page;

      // Генерируем QR-код как base64 изображение
      const qrImage = await QRCode.toDataURL(qrContent, {
        width: 300,
        margin: 2
      });

      // Вычисляем время истечения
      const expiresAt = new Date(Date.now() + this.paymentTimeout * 60 * 1000).toISOString();

      // Сохраняем информацию о платежной сессии
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
        }
      };

      await this.savePaymentSession(paymentSession);

      return {
        success: true,
        paymentId,
        sessionId,
        qrCode: {
          content: qrContent,
          image: qrImage
        },
        expiresAt,
        amount: orderData.totalPrice
      };

    } catch (error) {
      console.error('Ошибка создания платежной сессии:', error.message);
      throw new Error(`Не удалось создать платежную сессию: ${error.message}`);
    }
  }

  /**
   * Сохраняет информацию о платежной сессии в файл
   * @param {Object} paymentSession - Данные платежной сессии
   */
  async savePaymentSession(paymentSession) {
    const filePath = path.join(__dirname, 'history', `payment-${paymentSession.paymentId}.json`);
    await fs.writeFile(filePath, JSON.stringify(paymentSession, null, 2), 'utf8');
    console.log(`Платежная сессия сохранена: ${paymentSession.paymentId}`);
  }

  /**
   * Получает статус платежа из файла
   * @param {string} paymentId - ID платежа
   * @returns {Promise<Object>} - Данные платежа
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
   * @param {string} paymentId - ID платежа
   * @param {Object} updates - Обновления
   */
  async updatePaymentStatus(paymentId, updates) {
    const payment = await this.getPaymentStatus(paymentId);
    const updatedPayment = { ...payment, ...updates };
    await this.savePaymentSession(updatedPayment);
    return updatedPayment;
  }

  /**
   * Валидирует подпись вебхука от банка
   * @param {Object} payload - Тело запроса
   * @param {string} signature - Подпись из заголовка
   * @returns {boolean} - Валидна ли подпись
   */
  validateWebhookSignature(payload, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return signature === expectedSignature;
  }
}

module.exports = new PaymentService();
