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

// Читаем основной файл как JSON
const mainData = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

// Читаем новые товары
const newProducts = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// Добавляем новые товары
newProducts.forEach(product => {
    mainData.products.push(product);
});

// Сохраняем в правильном JSON формате
fs.writeFileSync('data/products.json', JSON.stringify(mainData, null, 4), 'utf8');

console.log(`Добавлено ${newProducts.length} товаров из файла ${inputFile}`);
console.log(`Всего товаров: ${mainData.products.length}`);

