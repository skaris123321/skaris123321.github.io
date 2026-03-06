const express = require('express');
const router = express.Router();

// Используем мок-сервис если не настроен реальный API
const useMockService = !process.env.SBP_API_KEY || process.env.SBP_API_KEY === 'your_api_key_here';
const paymentService = useMockService 
  ? require('../payments/mock-payment-service')
  : require('../payments/payment-service');

const { processPaymentWebhook } = require('../payments/webhook-handler');

if (useMockService) {
  console.log('ТЕСТОВЫЙ РЕЖИМ: Используется мок-сервис для платежей');
  console.log('Для включения реального API настройте SBP_API_KEY в .env');
}

/**
 * POST /api/payments/create
 * Создает новую платежную сессию и возвращает QR-код
 */
router.post('/create', async (req, res) => {
  try {
    const { orderData } = req.body;

    if (!orderData) {
      return res.status(400).json({
        success: false,
        message: 'Отсутствуют данные заказа'
      });
    }

    console.log('Создание платежной сессии для заказа:', {
      clientType: orderData.clientType,
      totalPrice: orderData.totalPrice,
      totalItems: orderData.totalItems
    });

    const paymentSession = await paymentService.createPaymentSession(orderData);

    res.json(paymentSession);

  } catch (error) {
    console.error('Ошибка создания платежа:', error);
    res.status(500).json({
      success: false,
      message: 'Не удалось создать платежную сессию',
      error: error.message
    });
  }
});

/**
 * GET /api/payments/status/:paymentId
 * Проверяет текущий статус платежа
 */
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await paymentService.getPaymentStatus(paymentId);

    // Проверяем, не истек ли платеж
    const now = new Date();
    const expiresAt = new Date(payment.expiresAt);
    
    if (payment.status === 'pending' && now > expiresAt) {
      // Обновляем статус на expired
      await paymentService.updatePaymentStatus(paymentId, { status: 'expired' });
      payment.status = 'expired';
    }

    res.json({
      success: true,
      paymentId: payment.paymentId,
      status: payment.status,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt
    });

  } catch (error) {
    console.error('Ошибка получения статуса платежа:', error);
    res.status(404).json({
      success: false,
      message: 'Платеж не найден',
      error: error.message
    });
  }
});

/**
 * POST /api/payments/webhook
 * Принимает вебхуки от банка о статусе платежа
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-partner-sign'];
    const webhookData = req.body;

    // Валидируем подпись вебхука
    if (!paymentService.validateWebhookSignature(webhookData, signature)) {
      console.error('Невалидная подпись вебхука');
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Обрабатываем вебхук
    const result = await processPaymentWebhook(webhookData);

    res.json(result);

  } catch (error) {
    console.error('Ошибка обработки вебхука:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
});

module.exports = router;


/**
 * ТЕСТОВЫЕ ENDPOINTS (только для мок-режима)
 */

if (useMockService) {
  /**
   * POST /api/payments/mock-pay/:paymentId
   * Симулирует успешную оплату (только для тестирования)
   */
  router.post('/mock-pay/:paymentId', async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      console.log(`Симуляция успешной оплаты: ${paymentId}`);
      
      await paymentService.mockPaymentSuccess(paymentId);
      
      // Симулируем вебхук от банка
      const webhookData = {
        type: 'payment_finished',
        session: {
          id: `ps_test_${Date.now()}`,
          status: 'accepted',
          acquiring_payments: [{
            id: paymentId,
            status: 'succeeded',
            finished_at: new Date().toISOString(),
            transaction_info: {
              fp_message_id: `mock_tx_${Date.now()}`
            }
          }]
        }
      };
      
      await processPaymentWebhook(webhookData);
      
      res.json({
        success: true,
        message: 'Тестовый платеж успешно обработан',
        paymentId
      });
      
    } catch (error) {
      console.error('Ошибка симуляции оплаты:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка симуляции оплаты',
        error: error.message
      });
    }
  });

  /**
   * POST /api/payments/mock-fail/:paymentId
   * Симулирует отклонение платежа (только для тестирования)
   */
  router.post('/mock-fail/:paymentId', async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      console.log(`Симуляция отклонения платежа: ${paymentId}`);
      
      await paymentService.mockPaymentFailure(paymentId);
      
      res.json({
        success: true,
        message: 'Тестовый платеж отклонен',
        paymentId
      });
      
    } catch (error) {
      console.error('Ошибка симуляции отклонения:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка симуляции отклонения',
        error: error.message
      });
    }
  });

  /**
   * GET /api/payments/mock-list
   * Список всех тестовых платежей
   */
  router.get('/mock-list', async (req, res) => {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const historyDir = path.join(__dirname, '../payments/history');
      const files = await fs.readdir(historyDir);
      
      const payments = [];
      for (const file of files) {
        if (file.startsWith('payment-') && file.endsWith('.json')) {
          const data = await fs.readFile(path.join(historyDir, file), 'utf8');
          const payment = JSON.parse(data);
          if (payment.isMock) {
            payments.push({
              paymentId: payment.paymentId,
              status: payment.status,
              amount: payment.amount,
              createdAt: payment.createdAt,
              clientType: payment.clientType
            });
          }
        }
      }
      
      res.json({
        success: true,
        count: payments.length,
        payments: payments.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )
      });
      
    } catch (error) {
      console.error('Ошибка получения списка:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения списка платежей',
        error: error.message
      });
    }
  });
}
