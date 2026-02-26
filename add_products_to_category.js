const fs = require('fs');

/**
 * Скрипт для добавления товаров в конкретную категорию
 * 
 * Использование:
 * 1. Создайте файл с новыми товарами (например, new_products.json)
 * 2. Укажите категорию: avr, control-cabinets, reactive-power, motor-control-boxes
 * 3. Запустите: node add_products_to_category.js <категория> <файл_с_товарами>
 */

// Получаем аргументы командной строки
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('❌ Использование: node add_products_to_category.js <категория> <файл_с_товарами>');
    console.log('\nДоступные категории:');
    console.log('  - avr');
    console.log('  - control-cabinets');
    console.log('  - reactive-power');
    console.log('  - motor-control-boxes');
    console.log('\nПример: node add_products_to_category.js motor-control-boxes new_boxes.json');
    process.exit(1);
}

const category = args[0];
const inputFile = args[1];

// Проверяем категорию
const validCategories = ['avr', 'control-cabinets', 'reactive-power', 'motor-control-boxes'];
if (!validCategories.includes(category)) {
    console.log(`❌ Неверная категория: ${category}`);
    console.log('Доступные категории:', validCategories.join(', '));
    process.exit(1);
}

// Проверяем существование файла с новыми товарами
if (!fs.existsSync(inputFile)) {
    console.log(`❌ Файл не найден: ${inputFile}`);
    process.exit(1);
}

const categoryFile = `data/products-${category}.json`;

try {
    // Читаем существующие товары категории
    let existingData = { products: [] };
    if (fs.existsSync(categoryFile)) {
        existingData = JSON.parse(fs.readFileSync(categoryFile, 'utf8'));
    }

    // Читаем новые товары
    const newProductsData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    let newProducts = [];

    // Поддерживаем разные форматы входного файла
    if (Array.isArray(newProductsData)) {
        newProducts = newProductsData;
    } else if (newProductsData.products && Array.isArray(newProductsData.products)) {
        newProducts = newProductsData.products;
    } else {
        console.log('❌ Неверный формат файла. Ожидается массив товаров или объект с полем products');
        process.exit(1);
    }

    // Находим максимальный ID среди всех категорий
    let maxId = 0;
    const allCategoryFiles = [
        'data/products-avr.json',
        'data/products-control-cabinets.json',
        'data/products-reactive-power.json',
        'data/products-motor-control-boxes.json'
    ];

    allCategoryFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const data = JSON.parse(fs.readFileSync(file, 'utf8'));
            data.products.forEach(p => {
                if (p.id > maxId) maxId = p.id;
            });
        }
    });

    console.log(`📊 Текущий максимальный ID: ${maxId}`);
    console.log(`📦 Товаров в категории ${category}: ${existingData.products.length}`);
    console.log(`➕ Новых товаров для добавления: ${newProducts.length}`);

    // Присваиваем ID новым товарам
    newProducts.forEach((product, index) => {
        if (!product.id || product.id <= maxId) {
            product.id = maxId + index + 1;
        }
    });

    // Добавляем новые товары
    existingData.products.push(...newProducts);

    // Сохраняем обновленный файл
    fs.writeFileSync(categoryFile, JSON.stringify(existingData, null, 4), 'utf8');

    // Обновляем индексный файл
    const indexFile = 'data/products-index.json';
    const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
    
    const categoryKey = category.replace(/-/g, '_');
    if (index.categories[categoryKey]) {
        index.categories[categoryKey].count = existingData.products.length;
    }
    
    fs.writeFileSync(indexFile, JSON.stringify(index, null, 4), 'utf8');

    console.log('\n✅ Товары успешно добавлены!');
    console.log(`📁 Файл: ${categoryFile}`);
    console.log(`📊 Всего товаров в категории: ${existingData.products.length}`);
    console.log(`🆔 Новые ID: ${maxId + 1} - ${maxId + newProducts.length}`);

} catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
}
