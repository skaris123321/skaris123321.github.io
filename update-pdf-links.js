const fs = require('fs');

// Читаем JSON файл
const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

// Обновляем ссылки на PDF файлы
data.products.forEach(product => {
  if (product.documentation && product.documentation.length > 0) {
    product.documentation.forEach(doc => {
      if (doc.url) {
        doc.url = doc.url
          .replace('Комплект чертежей шкафа АВР 25А на 2 ввода.pdf', 'avr-25a-2inputs-drawings.pdf')
          .replace('Комплект чертежей шкафа АВР 32А на 2 ввода.pdf', 'avr-32a-2inputs-drawings.pdf')
          .replace('Комплект чертежей шкафа АВР 40А на 2 ввода.pdf', 'avr-40a-2inputs-drawings.pdf')
          .replace('Комплект чертежей шкафа АВР 63А на 2 ввода.pdf', 'avr-63a-2inputs-drawings.pdf')
          .replace('Комплект чертежей шкафа АВР 80А на 2 ввода.pdf', 'avr-80a-2inputs-drawings.pdf')
          .replace('Комплект чертежей шкафа АВР 100А на 2 ввода.pdf', 'avr-100a-2inputs-drawings.pdf');
      }
    });
  }
});

// Записываем обновленный JSON
fs.writeFileSync('data/products.json', JSON.stringify(data, null, 2), 'utf8');
console.log('PDF links updated successfully!');