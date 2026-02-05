const fs = require('fs');

// Читаем файл products.json
const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

console.log('Исправляем артикулы для шкафов управления с прямым пуском...');

let fixedCount = 0;

// Исправляем артикулы для товаров с прямым пуском
data.products.forEach(product => {
    if (product.control_type === 'direct_start') {
        const oldArticle = product.article;
        
        // Все товары с прямым пуском должны иметь артикул ШУ-ПП-{количество насосов}-{мощность}-1-РОСЭК
        // независимо от типа пуска (прямой/частотное регулирование/плавный)
        const powerStr = product.motor_power.toString();
        const pumpCount = product.pump_count || 1;
        const newArticle = `ШУ-ПП-${pumpCount}-${powerStr}-1-РОСЭК`;
        
        if (product.article !== newArticle) {
            product.article = newArticle;
            console.log(`Исправлен артикул: ${oldArticle} -> ${newArticle}`);
            fixedCount++;
        }
        
        // Также исправляем артикул в specs, если он там есть
        if (product.specs && product.specs['Артикул']) {
            product.specs['Артикул'] = newArticle;
        }
    }
});

console.log(`Исправлено ${fixedCount} артикулов`);

// Сохраняем обновленный файл
fs.writeFileSync('data/products.json', JSON.stringify(data, null, 4));

console.log('Файл products.json обновлен!');