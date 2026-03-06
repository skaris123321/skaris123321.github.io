# Модуль оплаты через СБП

Этот модуль реализует интеграцию с Системой Быстрых Платежей (СБП) для обработки онлайн-платежей.

## Структура

```
payments/
├── payment-service.js      # Основной сервис для работы с платежами
├── webhook-handler.js      # Обработчик вебхуков от банка
├── order-processor.js      # Обработка заказов после оплаты
├── history/                # История платежей (JSON файлы)
└── README.md              # Эта документация
```

## Настройка

### 1. Переменные окружения

Добавьте в файл `.env`:

```env
# API Банка СБП
SBP_API_URL=https://api.bank131.ru
SBP_MERCHANT_ID=your_merchant_id_here
SBP_API_KEY=your_api_key_here
SBP_WEBHOOK_SECRET=your_webhook_secret_here

# Настройки платежей
PAYMENT_TIMEOUT_MINUTES=15
PAYMENT_POLL_INTERVAL_SECONDS=3
PAYMENT_RETRY_ATTEMPTS=3
```

### 2. Установка зависимостей

```bash
npm install axios qrcode
```

### 3. Настройка вебхуков

Настройте в личном кабинете банка URL для вебхуков:
```
https://your-domain.com/api/payments/webhook
```

## API Endpoints

### POST /api/payments/create

Создает новую платежную сессию и возвращает QR-код.

**Request:**
```json
{
  "orderData": {
    "clientType": "individual",
    "clientInfo": {
      "fullName": "Иван Иванов",
      "phone": "+7 (999) 123-45-67",
      "email": "ivan@example.com"
    },
    "items": [...],
    "totalItems": 5,
    "totalPrice": 10000
  }
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "pm_123456789",
  "sessionId": "ps_123456789",
  "qrCode": {
    "content": "https://qr.nspk.ru/...",
    "image": "data:image/png;base64,..."
  },
  "expiresAt": "2024-02-07T24:14:52Z",
  "amount": 10000
}
```

### GET /api/payments/status/:paymentId

Проверяет текущий статус платежа.

**Response:**
```json
{
  "success": true,
  "paymentId": "pm_123456789",
  "status": "pending",
  "transactionId": null,
  "paidAt": null,
  "expiresAt": "2024-02-07T24:14:52Z"
}
```

Возможные статусы:
- `pending` - Ожидание оплаты
- `succeeded` - Оплата успешна
- `failed` - Оплата отклонена
- `expired` - Истекло время

### POST /api/payments/webhook

Принимает вебхуки от банка о статусе платежа.

**Headers:**
- `x-partner-sign` - Подпись вебхука

**Request:**
```json
{
  "type": "payment_finished",
  "session": {
    "id": "ps_123456789",
    "status": "accepted",
    "acquiring_payments": [{
      "id": "pm_12345678",
      "status": "succeeded",
      "finished_at": "2024-02-07T23:59:52Z",
      "transaction_info": {
        "fp_message_id": "A50581324524670W0000040011450701"
      }
    }]
  }
}
```

## Поток оплаты

1. **Создание платежа**
   - Frontend вызывает `/api/payments/create`
   - Backend создает сессию через API банка
   - Генерируется QR-код
   - Данные сохраняются в `history/payment-{id}.json`

2. **Ожидание оплаты**
   - Frontend отображает QR-код
   - Запускается таймер (15 минут)
   - Каждые 3 секунды проверяется статус через `/api/payments/status/:id`

3. **Подтверждение оплаты**
   - Банк отправляет вебхук на `/api/payments/webhook`
   - Валидируется подпись вебхука
   - Обновляется статус платежа
   - Заказ автоматически отправляется в 1С

4. **Отправка в 1С**
   - Вызывается `order-processor.processOrder()`
   - Данные отправляются через `/api/orders`
   - При ошибке - автоматический retry (до 3 раз)
   - Клиент получает email подтверждение

## Безопасность

### Валидация вебхуков

Все вебхуки от банка валидируются по подписи:

```javascript
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

### Защита от повторной обработки

Используется Set для отслеживания обработанных вебхуков:

```javascript
const webhookId = `${session.id}-${type}`;
if (processedWebhooks.has(webhookId)) {
  return { success: true, message: 'Already processed' };
}
processedWebhooks.add(webhookId);
```

## Обработка ошибок

### Ошибки API банка

- Автоматический retry для проверки статуса (до 5 раз)
- Логирование всех ошибок
- Понятные сообщения для пользователя

### Ошибки отправки в 1С

- Автоматический retry с экспоненциальной задержкой (1с, 2с, 4с)
- Сохранение данных платежа для ручной обработки
- Email уведомления администратору

### Истечение времени

- Автоматическое обновление статуса на `expired`
- Возможность создать новый QR-код
- Логирование незавершенных платежей

## Мониторинг

### Логи

Все операции логируются с префиксами:
- `📦` - Создание платежа
- `✅` - Успешная операция
- `❌` - Ошибка
- `⚠️` - Предупреждение
- `📤` - Отправка данных
- `⏳` - Ожидание/retry

### Файлы платежей

Все платежи сохраняются в `history/payment-{id}.json`:

```json
{
  "paymentId": "pm_123456789",
  "sessionId": "ps_123456789",
  "orderId": "order-1707345592000",
  "status": "succeeded",
  "amount": 10000,
  "currency": "RUB",
  "clientType": "individual",
  "clientInfo": {...},
  "qrCode": {...},
  "createdAt": "2024-02-07T23:59:52Z",
  "expiresAt": "2024-02-08T00:14:52Z",
  "paidAt": "2024-02-08T00:05:30Z",
  "transactionId": "A50581324524670W0000040011450701",
  "orderData": {...}
}
```

## Тестирование

### Локальное тестирование

1. Запустите сервер:
```bash
npm start
```

2. Используйте ngrok для тестирования вебхуков:
```bash
ngrok http 3000
```

3. Настройте URL вебхука в личном кабинете банка:
```
https://your-ngrok-url.ngrok.io/api/payments/webhook
```

### Тестовые данные

Для тестирования используйте тестовые учетные данные API банка.

## Troubleshooting

### QR-код не генерируется

- Проверьте переменные окружения `SBP_API_KEY` и `SBP_MERCHANT_ID`
- Проверьте доступность API банка
- Проверьте логи сервера

### Вебхуки не приходят

- Проверьте настройки вебхуков в личном кабинете банка
- Проверьте доступность вашего сервера из интернета
- Проверьте `SBP_WEBHOOK_SECRET`

### Заказ не отправляется в 1С

- Проверьте доступность endpoint `/api/orders`
- Проверьте логи в консоли сервера
- Проверьте файл платежа в `history/`

## Поддержка

При возникновении проблем:
1. Проверьте логи сервера
2. Проверьте файлы платежей в `history/`
3. Свяжитесь с технической поддержкой банка
