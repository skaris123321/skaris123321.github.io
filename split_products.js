const fs = require('fs');

// Читаем исходный файл
const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

// Разделяем товары по категориям
const categories = {
    avr: [],           // АВР (monoblock, contactors, sectional)
    control_cabinets: [], // Шкафы управления
    reactive_power: [],   // Компенсация реактивной мощности
    motor_control_boxes: [] // Ящики управления (пока пусто)
};

// Распределяем товары
data.products.forEach(product => {
    if (product.commutation_type === 'monoblock' || 
        product.commutation_type === 'contactors' || 
        product.commutation_type === 'sectional') {
        categories.avr.push(product);
    } else if (product.commutation_type === 'control_cabinet') {
        categories.control_cabinets.push(product);
    } else if (product.commutation_type === 'reactive_power') {
        categories.reactive_power.push(product);
    } else if (product.commutation_type === 'motor_control_box') {
        categories.motor_control_boxes.push(product);
    }
});

// Создаем отдельные файлы для каждой категории
fs.writeFileSync('data/products-avr.json', JSON.stringify({ products: categories.avr }, null, 4), 'utf8');
fs.writeFileSync('data/products-control-cabinets.json', JSON.stringify({ products: categories.control_cabinets }, null, 4), 'utf8');
fs.writeFileSync('data/products-reactive-power.json', JSON.stringify({ products: categories.reactive_power }, null, 4), 'utf8');
fs.writeFileSync('data/products-motor-control-boxes.json', JSON.stringify({ products: categories.motor_control_boxes }, null, 4), 'utf8');

// Создаем индексный файл со ссылками на все категории
const index = {
    version: "2.0",
    description: "Разделенная база данных товаров по категориям",
    categories: {
        avr: {
            file: "products-avr.json",
            count: categories.avr.length,
            description: "Автоматический ввод резерва (АВР)"
        },
        control_cabinets: {
            file: "products-control-cabinets.json",
            count: categories.control_cabinets.length,
            description: "Шкафы управления"
        },
        reactive_power: {
            file: "products-reactive-power.json",
            count: categories.reactive_power.length,
            description: "Компенсация реактивной мощности"
        },
        motor_control_boxes: {
            file: "products-motor-control-boxes.json",
            count: categories.motor_control_boxes.length,
            description: "Ящики управления электродвигателями Я5000"
        }
    }
};

fs.writeFileSync('data/products-index.json', JSON.stringify(index, null, 4), 'utf8');

console.log('✓ Товары разделены по категориям:');
console.log(`  - АВР: ${categories.avr.length} товаров`);
console.log(`  - Шкафы управления: ${categories.control_cabinets.length} товаров`);
console.log(`  - Компенсация реактивной мощности: ${categories.reactive_power.length} товаров`);
console.log(`  - Ящики управления: ${categories.motor_control_boxes.length} товаров`);
console.log('\n✓ Создан индексный файл: data/products-index.json');
