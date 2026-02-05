const fs = require('fs');

// Читаем файл с продуктами
const data = fs.readFileSync('data/products.json', 'utf8');
const jsonData = JSON.parse(data);
const products = jsonData.products;

let fixedCount = 0;

console.log(`Всего продуктов: ${products.length}`);
console.log('Начинаем поиск продуктов с неправильными артикулами...');

// Исправляем все продукты с неправильными артикулами
products.forEach(product => {
    // Проверяем артикул
    if (product.article && product.article.includes('ШУ-ЧР-')) {
        console.log(`Найден продукт с неправильным артикулом: ID ${product.id}, артикул: ${product.article}`);
        
        // Исправляем артикул
        product.article = product.article.replace('ШУ-ЧР-', 'ШУ-ПП-');
        
        // Исправляем артикул в спецификациях
        if (product.specs && product.specs['Артикул']) {
            product.specs['Артикул'] = product.specs['Артикул'].replace('ШУ-ЧР-', 'ШУ-ПП-');
        }
        
        fixedCount++;
        console.log(`Исправлен продукт ID ${product.id}: ${product.article}`);
    }
});

// Сохраняем исправленный файл
fs.writeFileSync('data/products.json', JSON.stringify(jsonData, null, 4), 'utf8');

console.log(`\nВсего исправлено артикулов: ${fixedCount}`);
console.log('Файл data/products.json обновлен');