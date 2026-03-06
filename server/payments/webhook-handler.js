const paymentService = require('./payment-service');
const { processOrder } = require('./order-processor');

// Множество для отслеживания обработанных вебхуков
const processedWebhooks = new Set();

/**
 * Обрабатывает вебхук от банка о статусе платежа
 * @param {Object} webhookData - Данные вебхука
 * @returns {Promise<Object>} - Результат обработки
 */
async function processPaymentWebhook(webhookData) {
  try {
    const { type, session } = webhookData;

    // Проверяем, не обработан ли уже этот вебхук
    const webhookId = `${session.id}-${type}`;
    if (processedWebhooks.has(webhookId)) {
      console.log(`Вебхук уже обработан: ${webhookId}`);
      return { success: true, message: 'Webhook already processed' };
    }

    // Отмечаем вебхук как обработанный
    processedWebhooks.add(webhookId);

    // Обрабатываем только завершенные платежи
    if (type === 'payment_finished') {
      const payment = session.acquiring_payments[0];
      const paymentId = payment.id;
      const status = payment.status;

      console.log(`Получен вебхук для платежа ${paymentId}: ${status}`);

      // Получаем сохраненную информацию о платеже
      let paymentSession;
      try {
        paymentSession = await paymentService.getPaymentStatus(paymentId);
      } catch (error) {
        console.error(`Платеж не найден: ${paymentId}`);
        return { success: false, message: 'Payment not found' };
      }

      // Обновляем статус платежа
      const updates = {
        status: status === 'succeeded' ? 'succeeded' : 'failed',
        paidAt: payment.finished_at || new Date().toISOString(),
        transactionId: payment.transaction_info?.fp_message_id || null
      };

      await paymentService.updatePaymentStatus(paymentId, updates);

      console.log(`Статус платежа обновлен: ${paymentId} -> ${updates.status}`);

      // Если платеж успешен, отправляем заказ в 1С
      if (updates.status === 'succeeded') {
        console.log(`Платеж подтвержден, отправка в 1С: ${paymentId}`);
        
        try {
          await processOrder(paymentId);
          console.log(`Заказ успешно обработан: ${paymentId}`);
        } catch (error) {
          console.error(`Ошибка отправки заказа в 1С: ${error.message}`);
          // Не бросаем ошибку, чтобы вебхук считался обработанным
          // Заказ можно будет обработать вручную позже
        }
      }

      return { success: true, message: 'Webhook processed successfully' };
    }

    return { success: true, message: 'Webhook type not handled' };

  } catch (error) {
    console.error('Ошибка обработки вебхука:', error);
    throw error;
  }
}

module.exports = {
  processPaymentWebhook
};
