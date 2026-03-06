const axios = require('axios');
const paymentService = require('./payment-service');

/**
 * Обрабатывает заказ после успешной оплаты
 * @param {string} paymentId - ID платежа
 * @returns {Promise<Object>} - Результат обработки
 */
async function processOrder(paymentId) {
  try {
    // Получаем данные платежа
    const payment = await paymentService.getPaymentStatus(paymentId);

    // Проверяем статус платежа
    if (payment.status !== 'succeeded') {
      throw new Error(`Платеж не подтвержден. Статус: ${payment.status}`);
    }

    console.log(`Отправка заказа в 1С для платежа ${paymentId}`);

    // Формируем данные для отправки в 1С
    const orderData = {
      orderDate: payment.createdAt,
      paymentId: payment.paymentId,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt,
      clientType: payment.clientType,
      clientInfo: payment.clientInfo,
      items: payment.orderData.items,
      totalItems: payment.orderData.totalItems,
      totalPrice: payment.orderData.totalPrice
    };

    // Отправляем в 1С с retry логикой
    const result = await sendTo1CWithRetry(orderData);

    console.log(`Заказ успешно отправлен в 1С: ${paymentId}`);

    return result;

  } catch (error) {
    console.error(`Ошибка обработки заказа ${paymentId}:`, error);
    throw error;
  }
}

/**
 * Отправляет заказ в 1С с retry логикой
 * @param {Object} orderData - Данные заказа
 * @param {number} attempt - Номер попытки
 * @returns {Promise<Object>} - Результат отправки
 */
async function sendTo1CWithRetry(orderData, attempt = 1) {
  const maxAttempts = parseInt(process.env.PAYMENT_RETRY_ATTEMPTS) || 3;

  try {
    // Отправляем через существующий endpoint /api/orders
    const response = await axios.post('http://localhost:3000/api/orders', orderData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 секунд
    });

    if (response.data.success) {
      return {
        success: true,
        orderId: response.data.orderId,
        message: 'Заказ успешно отправлен в 1С'
      };
    } else {
      throw new Error(response.data.message || 'Ошибка отправки в 1С');
    }

  } catch (error) {
    console.error(`Попытка ${attempt}/${maxAttempts} не удалась:`, error.message);

    // Если это не последняя попытка, повторяем с экспоненциальной задержкой
    if (attempt < maxAttempts) {
      const delay = Math.pow(2, attempt - 1) * 1000; // 1с, 2с, 4с
      console.log(`⏳ Повтор через ${delay}мс...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendTo1CWithRetry(orderData, attempt + 1);
    }

    // Все попытки исчерпаны
    throw new Error(`Не удалось отправить заказ в 1С после ${maxAttempts} попыток: ${error.message}`);
  }
}

module.exports = {
  processOrder
};
