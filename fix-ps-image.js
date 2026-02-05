const fs = require('fs');

// Читаем файл products.json
const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

console.log('Исправляем путь к картинке ps.png на ps.jpeg...');

let fixedCount = 0;

// Исправляем путь к картинке для товаров с прямым пуском
data.products.forEach(product => {
    if (product.control_type === 'direct_start') {
        // Исправляем main_image
        if (product.main_image === 'images/ps.png') {
            product.main_image = 'images/ps.jpeg';
            fixedCount++;
        }
        
        // Исправляем images массив
        if (product.images && Array.isArray(product.images)) {
            product.images = product.images.map(img => {
                if (img === 'images/ps.png') {
                    return 'images/ps.jpeg';
                }
                return img;
            });
        }
    }
});

console.log(`Исправлено ${fixedCount} товаров`);

// Сохраняем обновленный файл
fs.writeFileSync('data/products.json', JSON.stringify(data, null, 4));

console.log('Файл products.json обновлен!');