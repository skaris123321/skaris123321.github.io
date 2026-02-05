const fs = require('fs');

console.log('Читаем файл products.json...');
const data = fs.readFileSync('data/products.json', 'utf8');
const jsonData = JSON.parse(data);

let fixedArticles = 0;
let fixedSpecs = 0;

console.log(`Всего продуктов: ${jsonData.products.length}`);

// Проходим по всем продуктам
jsonData.products.forEach((product, index) => {
    // Исправляем артикул
    if (product.article && product.article.includes('ШУ-ЧР-')) {
        const oldArticle = product.article;
        product.article = product.article.replace('ШУ-ЧР-', 'ШУ-ПП-');
        console.log(`Продукт ${product.id}: ${oldArticle} → ${product.article}`);
        fixedArticles++;
    }
    
    // Исправляем артикул в спецификациях
    if (product.specs && product.specs['Артикул'] && product.specs['Артикул'].includes('ШУ-ЧР-')) {
        const oldSpec = product.specs['Артикул'];
        product.specs['Артикул'] = product.specs['Артикул'].replace('ШУ-ЧР-', 'ШУ-ПП-');
        console.log(`Спецификация ${product.id}: ${oldSpec} → ${product.specs['Артикул']}`);
        fixedSpecs++;
    }
});

console.log(`\nИсправлено артикулов: ${fixedArticles}`);
console.log(`Исправлено спецификаций: ${fixedSpecs}`);

if (fixedArticles > 0 || fixedSpecs > 0) {
    console.log('Сохраняем файл...');
    fs.writeFileSync('data/products.json', JSON.stringify(jsonData, null, 4), 'utf8');
    console.log('Файл сохранен!');
} else {
    console.log('Нечего исправлять');
}