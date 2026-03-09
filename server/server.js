const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your-app-password-here') {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error('Ошибка подключения к email:', error);
      console.log('Email не настроен, но сервер работает. Обновление цен доступно!');
    } else {
      console.log('Email сервис готов к отправке писем');
    }
  });
} else {
  console.log('Email не настроен. Для отправки заказов настройте .env файл');
  console.log('Обновление цен работает без email!');
}

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

async function saveOrder(orderData) {
  const ordersDir = path.join(__dirname, 'orders');
  
  try {
    await fs.mkdir(ordersDir, { recursive: true });
  } catch (error) {
    console.error('Ошибка создания папки orders:', error);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `order-${timestamp}.json`;
  const filepath = path.join(ordersDir, filename);

  try {
    await fs.writeFile(filepath, JSON.stringify(orderData, null, 2), 'utf8');
    console.log(`Заказ сохранен: ${filename}`);
    return filename;
  } catch (error) {
    console.error('Ошибка сохранения заказа:', error);
    throw error;
  }
}

function generateEmailHTML(orderData) {
  const clientTypeText = orderData.clientType === 'individual' ? 'Физическое лицо' : 'Юридическое лицо';
  
  let clientInfo = '';
  if (orderData.clientType === 'individual') {
    clientInfo = `
      <tr><td><strong>ФИО:</strong></td><td>${orderData.fullName}</td></tr>
      <tr><td><strong>Телефон:</strong></td><td>${orderData.phone}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${orderData.email}</td></tr>
      ${orderData.address ? `<tr><td><strong>Адрес доставки:</strong></td><td>${orderData.address}</td></tr>` : ''}
    `;
  } else {
    clientInfo = `
      <tr><td><strong>Организация:</strong></td><td>${orderData.companyName}</td></tr>
      <tr><td><strong>ИНН:</strong></td><td>${orderData.inn}</td></tr>
      ${orderData.kpp ? `<tr><td><strong>КПП:</strong></td><td>${orderData.kpp}</td></tr>` : ''}
      <tr><td><strong>Юридический адрес:</strong></td><td>${orderData.legalAddress}</td></tr>
      <tr><td><strong>Контактное лицо:</strong></td><td>${orderData.contactPerson}</td></tr>
      <tr><td><strong>Телефон:</strong></td><td>${orderData.phone}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${orderData.email}</td></tr>
    `;
  }

  const itemsHTML = orderData.items.map((item, index) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 15px 10px;">${index + 1}</td>
      <td style="padding: 15px 10px;">
        <strong>${item.productTitle}</strong><br>
        <small style="color: #666;">Артикул: ${item.article}</small><br>
        <small style="color: #666;">Производитель: ${item.manufacturerBrand}</small>
      </td>
      <td style="padding: 15px 10px; text-align: center;">${item.quantity} шт.</td>
      <td style="padding: 15px 10px; text-align: right;">${formatPrice(item.totalPrice)}</td>
      <td style="padding: 15px 10px; text-align: right;"><strong>${formatPrice(item.totalPrice * item.quantity)}</strong></td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #92400e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
        th { background: #92400e; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .total { font-size: 1.3em; font-weight: bold; color: #92400e; text-align: right; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Новый заказ с сайта РОСЭК</h1>
        </div>
        <div class="content">
          <h2>Информация о клиенте</h2>
          <table>
            <tr><td><strong>Тип клиента:</strong></td><td>${clientTypeText}</td></tr>
            <tr><td><strong>Дата заказа:</strong></td><td>${orderData.orderDate}</td></tr>
            ${clientInfo}
            ${orderData.comment ? `<tr><td><strong>Комментарий:</strong></td><td>${orderData.comment}</td></tr>` : ''}
          </table>

          <h2>Товары в заказе</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">№</th>
                <th>Товар</th>
                <th style="width: 100px; text-align: center;">Количество</th>
                <th style="width: 120px; text-align: right;">Цена</th>
                <th style="width: 120px; text-align: right;">Сумма</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="total">
            Всего товаров: ${orderData.totalItems} шт.<br>
            ИТОГО: ${formatPrice(orderData.totalPrice)}
          </div>
        </div>
        <div class="footer">
          <p>Это автоматическое письмо с сайта rosek.tech</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// API endpoint для создания заказа
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    
    console.log('Получен новый заказ:', {
      clientType: orderData.clientType,
      totalItems: orderData.totalItems,
      totalPrice: orderData.totalPrice
    });

    // Сохраняем заказ в файл
    const filename = await saveOrder(orderData);

    // Отправляем email только если настроен
    if (transporter) {
      // Формируем письмо
      const emailHTML = generateEmailHTML(orderData);
      const emailSubject = `Новый заказ с сайта РОСЭК от ${orderData.orderDate}`;

      // Отправляем email
      const mailOptions = {
        from: `"РОСЭК - Заказы" <${process.env.EMAIL_USER}>`,
        to: process.env.ORDER_EMAIL,
        subject: emailSubject,
        html: emailHTML
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Email отправлен на:', process.env.ORDER_EMAIL);
      } catch (emailError) {
        console.error('Ошибка отправки email:', emailError.message);
        console.log('Заказ сохранен в файл, но email не отправлен');
      }

      // Отправляем подтверждение клиенту
      if (orderData.email) {
        const clientMailOptions = {
          from: `"РОСЭК" <${process.env.EMAIL_USER}>`,
          to: orderData.email,
          subject: 'Ваш заказ принят - РОСЭК',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #92400e;">Спасибо за ваш заказ!</h2>
              <p>Ваш заказ успешно принят и передан в обработку.</p>
              <p><strong>Номер заказа:</strong> ${filename.replace('.json', '')}</p>
              <p><strong>Дата:</strong> ${orderData.orderDate}</p>
              <p><strong>Сумма:</strong> ${formatPrice(orderData.totalPrice)}</p>
              <p>Мы свяжемся с вами в ближайшее время для уточнения деталей.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 0.9em;">
                С уважением,<br>
                Команда РОСЭК<br>
                Телефон: 8 (800) 55-11-052<br>
                Email: zakaz@rosek.tech
              </p>
            </div>
          `
        };
        
        try {
          await transporter.sendMail(clientMailOptions);
          console.log('Подтверждение отправлено клиенту:', orderData.email);
        } catch (emailError) {
          console.log('Не удалось отправить подтверждение клиенту');
        }
      }
    } else {
      console.log('Email не настроен. Заказ сохранен в файл:', filename);
    }

    // Отправляем успешный ответ
    res.json({
      success: true,
      message: 'Заказ успешно оформлен',
      orderId: filename.replace('.json', '')
    });

  } catch (error) {
    console.error('Ошибка обработки заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при оформлении заказа',
      error: error.message
    });
  }
});

// Проверка работы сервера
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Сервер работает',
    timestamp: new Date().toISOString()
  });
});

// Endpoint для обновления цен из 1С
app.post('/api/products/update-prices', async (req, res) => {
  try {
    // Проверка токена авторизации
    const authHeader = req.headers['authorization'];
    const expectedToken = process.env.API_TOKEN || 'default-token-change-me';
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized: Invalid or missing API token' 
      });
    }

    const { prices } = req.body; // Массив { article, price }
    
    if (!Array.isArray(prices)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Поле prices должно быть массивом' 
      });
    }

    console.log(`Получен запрос на обновление цен: ${prices.length} товаров`);

    // Все файлы с товарами
    const categoryFiles = [
      'data/products-avr.json',
      'data/products-control-cabinets.json',
      'data/products-motor-control-boxes.json',
      'data/products-reactive-power.json'
    ];

    let updatedCount = 0;
    let notFoundArticles = [];

    // Обрабатываем каждый файл категории
    for (const categoryFile of categoryFiles) {
      const filePath = path.join(__dirname, '..', categoryFile);
      
      try {
        // Читаем файл
        const fileContent = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        // Обновляем цены
        let fileUpdated = false;
        
        data.products.forEach(product => {
          const priceUpdate = prices.find(p => p.article === product.article);
          
          if (priceUpdate) {
            const oldPrice = product.base_price;
            product.base_price = priceUpdate.price;
            
            if (oldPrice !== priceUpdate.price) {
              console.log(`  ${product.article}: ${oldPrice} → ${priceUpdate.price} ₽`);
              updatedCount++;
              fileUpdated = true;
            }
          }
        });
        
        // Сохраняем файл только если были изменения
        if (fileUpdated) {
          await fs.writeFile(filePath, JSON.stringify(data, null, 4), 'utf8');
          console.log(`  Сохранен файл: ${categoryFile}`);
        }
        
      } catch (error) {
        console.error(`Ошибка обработки файла ${categoryFile}:`, error.message);
      }
    }

    // Проверяем, какие артикулы не найдены
    prices.forEach(priceItem => {
      let found = false;
      
      for (const categoryFile of categoryFiles) {
        const filePath = path.join(__dirname, '..', categoryFile);
        try {
          const fileContent = require('fs').readFileSync(filePath, 'utf8');
          const data = JSON.parse(fileContent);
          if (data.products.some(p => p.article === priceItem.article)) {
            found = true;
            break;
          }
        } catch (e) {}
      }
      
      if (!found) {
        notFoundArticles.push(priceItem.article);
      }
    });

    console.log(`Обновлено цен: ${updatedCount}`);
    
    if (notFoundArticles.length > 0) {
      console.log(`Не найдены артикулы: ${notFoundArticles.join(', ')}`);
    }

    res.json({
      success: true,
      message: 'Цены обновлены',
      updated: updatedCount,
      notFound: notFoundArticles
    });

  } catch (error) {
    console.error('Ошибка обновления цен:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении цен',
      error: error.message
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   РОСЭК Order Server запущен          ║
║   Порт: ${PORT}                         ║
║   Email: ${process.env.EMAIL_USER}     ║
╚════════════════════════════════════════╝
  `);
});
