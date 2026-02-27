const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./data/products-motor-control-boxes.json', 'utf8'));

console.log('Обновляем артикулы ящиков управления...\n');

let updated = 0;

data.products.forEach(product => {
  const oldArticle = product.article;
  
  // Заменяем Я5111, Я5121, Я5131 на Я5000
  let newArticle = oldArticle
    .replace(/^Я5111/, 'Я5000')
    .replace(/^Я5121/, 'Я5000')
    .replace(/^Я5131/, 'Я5000');
  
  if (oldArticle !== newArticle) {
    product.article = newArticle;
    
    // Также обновляем артикул в specs если он там есть
    if (product.specs && product.specs['Артикул']) {
      product.specs['Артикул'] = newArticle;
    }
    
    updated++;
    
    if (updated <= 5) {
      console.log(`  ${oldArticle} → ${newArticle}`);
    }
  }
});

console.log(`\nОбновлено артикулов: ${updated}`);
console.log(`Всего товаров: ${data.products.length}`);

// Сохраняем
fs.writeFileSync('./data/products-motor-control-boxes.json', JSON.stringify(data, null, 4), 'utf8');

console.log('\n✓ Файл обновлен');

// Проверяем результат
const uniqueArticles = [...new Set(data.products.map(p => p.article.substring(0, 5)))];
console.log('\nУникальные префиксы артикулов:', uniqueArticles.join(', '));
