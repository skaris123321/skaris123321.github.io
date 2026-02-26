const fs = require('fs');

// Читаем основной файл
const mainData = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

// Читаем новые товары
const newProducts = JSON.parse(fs.readFileSync('add_single_feeders_part2.json', 'utf8'));

// Добавляем новые товары
newProducts.forEach(product => {
    mainData.products.push(product);
});

// Сохраняем
fs.writeFileSync('data/products.json', JSON.stringify(mainData, null, 4), 'utf8');

console.log(`Добавлено ${newProducts.length} товаров TDM с контактами состояния (ID 1391-1405)`);
console.log(`Всего товаров: ${mainData.products.length}`);
