const fs = require('fs');

const content = fs.readFileSync('data/products.json', 'utf8');
const jsonData = JSON.parse(content);

let wrongArticles = 0;
let wrongSpecs = 0;

jsonData.products.forEach(product => {
    if (product.article && product.article.includes('ШУ-ЧР-')) {
        console.log(`Неправильный артикул ID ${product.id}: ${product.article}`);
        wrongArticles++;
    }
    
    if (product.specs && product.specs['Артикул'] && product.specs['Артикул'].includes('ШУ-ЧР-')) {
        console.log(`Неправильная спецификация ID ${product.id}: ${product.specs['Артикул']}`);
        wrongSpecs++;
    }
});

console.log(`\nВсего неправильных артикулов: ${wrongArticles}`);
console.log(`Всего неправильных спецификаций: ${wrongSpecs}`);