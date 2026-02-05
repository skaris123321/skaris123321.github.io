const fs = require('fs');

console.log('Читаем файл...');
let content = fs.readFileSync('data/products.json', 'utf8');

console.log('Ищем артикулы ШУ-ЧР-...');
const beforeCount = (content.match(/ШУ-ЧР-/g) || []).length;
console.log(`Найдено: ${beforeCount} вхождений`);

if (beforeCount > 0) {
    console.log('Заменяем ШУ-ЧР- на ШУ-ПП-...');
    content = content.replace(/ШУ-ЧР-/g, 'ШУ-ПП-');
    
    const afterCount = (content.match(/ШУ-ЧР-/g) || []).length;
    const fixedCount = (content.match(/ШУ-ПП-/g) || []).length;
    
    console.log(`После замены осталось ШУ-ЧР-: ${afterCount}`);
    console.log(`Стало ШУ-ПП-: ${fixedCount}`);
    
    console.log('Сохраняем файл...');
    fs.writeFileSync('data/products.json', content, 'utf8');
    console.log('Готово!');
} else {
    console.log('Артикулы для замены не найдены');
}