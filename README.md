# РОСЭК - Интернет-магазин электрооборудования

## 🚀 Быстрый старт

### Запуск сервера

**Windows (cmd):**
```cmd
cd C:\Users\nogovitsina.ea\Desktop\сайт\rosek-site\server
npm install
npm start
```

**Или через PowerShell:**
```powershell
cd "C:\Users\nogovitsina.ea\Desktop\сайт\rosek-site\server"
npm install
npm start
```

Сервер запустится на `http://localhost:3000`

### Открыть сайт

**Вариант 1: Локально (для разработки)**
Откройте `index.html` в браузере

**Вариант 2: GitHub Pages (рабочая версия)**
```
https://skaris123321.github.io/
```

⚠️ **ВАЖНО:** Сайт на GitHub Pages работает БЕЗ сервера! 
Для работы оплаты и обновления цен нужен запущенный сервер.

---

## 📦 Структура проекта

```
├── index.html              # Главная страница
├── category/               # Страницы каталога и корзины
├── css/                    # Стили
├── js/                     # JavaScript файлы
├── data/                   # JSON файлы с товарами
├── images/                 # Изображения
├── documents/              # PDF документы
├── server/                 # Backend сервер
│   ├── payments/          # Модуль оплаты СБП
│   ├── .env              # Конфигурация
│   └── server.js         # Основной файл сервера
└── test-payment.html      # Страница для тестирования оплаты
```

---

## 💳 Оплата через СБП

### Тестирование оплаты

1. Запустите сервер (см. выше)
2. Откройте `test-payment.html` в браузере
3. Создайте тестовый платеж
4. Нажмите "✅ Успешная оплата" для симуляции

### Режимы работы

**Тестовый режим (по умолчанию):**
- Не требует настройки API банка
- Используется для разработки
- Можно симулировать успешную оплату и отклонение

**Реальный режим:**
- Требует учетные данные API банка в `server/.env`
- Используется на продакшене

---

## 🔄 Интеграция с 1С

### Обновление цен товаров

**Для локального тестирования:**
```
POST http://localhost:3000/api/products/update-prices
```

**Для работы с GitHub Pages (через ngrok):**
```
POST https://your-ngrok-url.ngrok.io/api/products/update-prices
```

**Для продакшена (если сервер на хостинге):**
```
POST https://rosek.tech/api/products/update-prices
```

**Формат запроса:**
```json
{
  "prices": [
    {"article": "AVR-25A-2V", "price": 15000},
    {"article": "AVR-32A-2V", "price": 18000}
  ]
}
```

**Тест:**
```bash
curl -X POST http://localhost:3000/api/products/update-prices \
  -H "Content-Type: application/json" \
  -d '{"prices":[{"article":"AVR-25A-2V","price":15000}]}'
```

### Получение заказов

Заказы автоматически отправляются на:
```
POST http://localhost:3000/api/orders
```

После успешной оплаты через СБП.

**Формат заказа:**
```json
{
  "paymentId": "pm_123456789",
  "transactionId": "tx_123",
  "clientType": "individual",
  "clientInfo": {
    "fullName": "Иванов Иван",
    "phone": "+7 (999) 123-45-67",
    "email": "ivan@example.com"
  },
  "items": [
    {
      "article": "AVR-25A-2V",
      "productTitle": "АВР на 25А",
      "quantity": 2,
      "unitPrice": 15000,
      "totalPrice": 30000
    }
  ],
  "totalPrice": 30000
}
```

---

## 🌐 Доступ из интернета (для программиста 1С)

⚠️ **ВАЖНО:** Сайт на GitHub Pages (https://skaris123321.github.io/) - это только frontend!
Для работы с 1С нужен запущенный backend сервер.

### Вариант 1: Через ngrok (РЕКОМЕНДУЕТСЯ)

**Шаг 1:** Запустите сервер
```cmd
cd C:\Users\nogovitsina.ea\Desktop\сайт\rosek-site\server
npm start
```

**Шаг 2:** В новом окне терминала запустите ngrok
```cmd
cd C:\Users\nogovitsina.ea\Desktop\сайт\rosek-site
ngrok http 3000
```

**Шаг 3:** Скопируйте URL из ngrok (например `https://abc123.ngrok.io`)

**Шаг 4:** Дайте программисту 1С:
```
POST https://abc123.ngrok.io/api/products/update-prices
```

### Вариант 2: Разместить сервер на хостинге

Если разместите backend на отдельном сервере:
```
POST https://api.rosek.tech/api/products/update-prices
```

---

## ⚙️ Конфигурация

### Файл `server/.env`

```env
# Сервер
PORT=3000

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ORDER_EMAIL=orders@rosek.tech

# API Банка СБП (для реального режима)
SBP_API_URL=https://api.bank131.ru
SBP_MERCHANT_ID=your_merchant_id
SBP_API_KEY=your_api_key
SBP_WEBHOOK_SECRET=your_webhook_secret

# Настройки платежей
PAYMENT_TIMEOUT_MINUTES=15
PAYMENT_POLL_INTERVAL_SECONDS=3
PAYMENT_RETRY_ATTEMPTS=3
```

---

## 🧪 Тестирование

### Тест оплаты через сайт

1. Откройте `index.html`
2. Добавьте товары в корзину
3. Оформите заказ
4. В консоли браузера (F12) найдите `paymentId`
5. Выполните:
```javascript
fetch('/api/payments/mock-pay/pm_test_1707345592000', { method: 'POST' })
```

### Тест обновления цен

```bash
curl -X POST http://localhost:3000/api/products/update-prices \
  -H "Content-Type: application/json" \
  -d '{
    "prices": [
      {"article": "AVR-25A-2V", "price": 15000}
    ]
  }'
```

### Проверка работы сервера

```bash
curl http://localhost:3000/api/health
```

---

## 📝 Полезные команды

**Запуск сервера:**
```cmd
cd C:\Users\nogovitsina.ea\Desktop\сайт\rosek-site\server
npm start
```

**Запуск с автоперезагрузкой:**
```cmd
cd C:\Users\nogovitsina.ea\Desktop\сайт\rosek-site\server
npm run dev
```

**Список тестовых платежей:**
```cmd
curl http://localhost:3000/api/payments/mock-list
```

**Очистка тестовых платежей:**
```cmd
cd C:\Users\nogovitsina.ea\Desktop\сайт\rosek-site\server\payments\history
del payment-pm_test_*.json
```

**Загрузка изменений на GitHub:**
```cmd
cd C:\Users\nogovitsina.ea\Desktop\сайт\rosek-site
git add .
git commit -m "Обновление"
git push
```

---

## 🐛 Решение проблем

### Сервер не запускается
```bash
cd server
npm install
npm start
```

### QR-код не отображается
- Проверьте, что сервер запущен
- Откройте консоль браузера (F12) на ошибки

### Цены не обновляются
- Проверьте артикулы (должны точно совпадать)
- Проверьте логи сервера
- Проверьте файлы в `data/`

---

## 📞 Контакты

- Email: enogovicina167@gmail.com
- Телефон: 8 (800) 55-11-052

---

## 📚 Дополнительная документация

- `server/payments/README.md` - Подробная документация модуля оплаты
- `test-payment.html` - Интерактивная страница для тестирования
