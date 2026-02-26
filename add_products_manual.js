const fs = require('fs');

// Читаем файл как текст
let content = fs.readFileSync('data/products.json', 'utf8');

// Читаем новые товары
const newProducts = JSON.parse(fs.readFileSync('add_single_feeders_part6.json', 'utf8'));

// Находим последнюю запятую перед закрывающими скобками
const lastBrace = content.lastIndexOf(']');
const beforeBrace = content.substring(0, lastBrace);

// Формируем строки новых товаров
let newProductsStr = '';
newProducts.forEach((product, index) => {
    newProductsStr += ',\n                     ' + JSON.stringify(product);
});

// Вставляем новые товары
const newContent = beforeBrace + newProductsStr + '\n                ]\n}';

// Сохраняем
fs.writeFileSync('data/products.json', newContent, 'utf8');

console.log(`Добавлено ${newProducts.length} товаров EKF с переключателем (ID 1451-1465)`);
