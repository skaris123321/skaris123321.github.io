# РОСЭК Server

Серверная часть сайта для приема заказов и обновления цен из 1С.

## Возможности

- Прием заказов с сайта
- Отправка email уведомлений
- Обновление цен товаров из 1С
- Защита API токеном

## Установка

```bash
cd server
npm install
```

## Настройка

Отредактируйте файл `.env`:

```env
PORT=3000
API_TOKEN=ваш-секретный-токен
EMAIL_USER=ваш-email@gmail.com
EMAIL_PASS=пароль-приложения-gmail
ORDER_EMAIL=куда-отправлять-заказы@gmail.com
```

## Запуск

### Разработка
```bash
node server.js
```

### Продакшен (с автозапуском)
```bash
npm install -g pm2
pm2 start server.js --name rosek-server
pm2 save
pm2 startup
```

## API Endpoints

### 1. Прием заказа
```
POST /api/orders
Content-Type: application/json

{
  "clientType": "individual",
  "fullName": "Иван Иванов",
  "phone": "+79001234567",
  "email": "ivan@example.com",
  "items": [...],
  "totalPrice": 50000,
  "totalItems": 3
}
```

### 2. Обновление цен из 1С
```
POST /api/products/update-prices
Authorization: Bearer ваш-секретный-токен
Content-Type: application/json

{
  "prices": [
    { "article": "Я5000-0.6-РОСЭК", "price": 15000 },
    { "article": "АВР-25А-2В-CHINT", "price": 45000 }
  ]
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Цены обновлены",
  "updated": 2,
  "notFound": []
}
```

## Интеграция с 1С

Подробная инструкция находится в файле `ИНСТРУКЦИЯ_ПО_РАЗМЕЩЕНИЮ.md` в корне проекта.

## Логи

Все операции логируются в консоль:
- Прием заказов
- Отправка email
- Обновление цен
- Ошибки

## Безопасность

- API обновления цен защищен токеном
- Используйте HTTPS на продакшене
- Храните `.env` в секрете
- Регулярно меняйте API_TOKEN
