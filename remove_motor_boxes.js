const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

console.log('Всего товаров до удаления:', data.products.length);

// Удаляем все ящики управления
data.products = data.products.filter(p => p.commutation_type !== 'motor_control_box');

console.log('Всего товаров после удаления:', data.products.length);

// Сохраняем
fs.writeFileSync('data/products.json', JSON.stringify(data, null, 4), 'utf8');

console.log('Ящики управления удалены');
