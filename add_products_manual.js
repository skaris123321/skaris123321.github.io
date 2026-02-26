const fs = require('fs');

// Получаем имя файла из аргументов командной строки
const inputFile = process.argv[2];

if (!inputFile) {
    console.error('Ошибка: укажите файл с товарами');
    console.error('Использование: node add_products_manual.js <файл.json>');
    process.exit(1);
}

if (!fs.existsSync(inputFile)) {
    console.error(`Ошибка: файл ${inputFile} не найден`);
    process.exit(1);
}

// Читаем файл как текст
let content = fs.readFileSync('data/products.json', 'utf8');

// Читаем новые товары
const newProducts = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

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

console.log(`Добавлено ${newProducts.length} товаров из файла ${inputFile}`);

