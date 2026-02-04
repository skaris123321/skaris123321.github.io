const fs = require('fs');

// Читаем JSON файл
let jsonContent = fs.readFileSync('data/products.json', 'utf8');
if (jsonContent.charCodeAt(0) === 0xFEFF) {
    jsonContent = jsonContent.slice(1);
}
const data = JSON.parse(jsonContent);

// Мощности для преобразователей частоты
const powers = [0.75, 3.7, 7.5, 15, 18.5, 22, 37, 45, 55, 75, 90, 110, 132, 160, 200, 220];

// Дополнительные бренды
const additionalBrands = ['IEK', 'Systeme electric', 'TDM', 'VEDA'];

// Функция для определения изображения по мощности
function getImageByPower(power) {
    if (power >= 0.75 && power <= 18.5) {
        return 'images/sp-3.7.png';
    } else if (power >= 22 && power <= 90) {
        return 'images/sp-90.png';
    } else if (power >= 110 && power <= 220) {
        return 'images/sp-220.png';
    }
    return 'images/sp-90.png'; // По умолчанию
}

// Функция для расчета базовой цены
function calculatePrice(power, brand) {
    let basePrice = 50000; // Базовая цена
    
    // Цена зависит от мощности
    if (power <= 3.7) basePrice = 45000;
    else if (power <= 15) basePrice = 65000;
    else if (power <= 22) basePrice = 85000;
    else if (power <= 45) basePrice = 120000;
    else if (power <= 75) basePrice = 180000;
    else if (power <= 110) basePrice = 250000;
    else if (power <= 160) basePrice = 350000;
    else basePrice = 450000;
    
    // Коэффициент по бренду
    const brandMultiplier = {
        'IEK': 0.92,
        'Systeme electric': 1.1,
        'TDM': 0.88,
        'VEDA': 0.85
    };
    
    return Math.round(basePrice * (brandMultiplier[brand] || 1.0));
}

// Сертификат для добавления
const certificate = {
    "name": "Сертификат НКУ (ТР ТС) 2024-2029",
    "url": "../documents/Сертификат НКУ (ТР ТС) 2024-2029.pdf",
    "size": 1251760,
    "type": "pdf"
};

// Находим максимальный ID
let maxId = 0;
data.products.forEach(product => {
    if (product.id > maxId) {
        maxId = product.id;
    }
});

let currentId = maxId + 1;
let addedCount = 0;

console.log(`Начинаем добавление с ID: ${currentId}`);

// Создаем товары для каждой комбинации мощности и дополнительного бренда
powers.forEach(power => {
    additionalBrands.forEach(brand => {
        const powerStr = power.toString().replace('.', '_'); // 0.75 -> 0_75
        const image = getImageByPower(power);
        const price = calculatePrice(power, brand);
        
        const product = {
            "id": currentId,
            "article": `ШУ-ПЧ-${powerStr}-1-РОСЭК`,
            "motor_power": power,
            "brand": brand,
            "commutation_type": "control_cabinet",
            "control_type": "frequency_converter",
            "inputs_count": "1",
            "phases_count": "3",
            "base_price": price,
            "main_image": image,
            "images": [image],
            "description": `Шкаф управления с преобразователем частоты ${power} кВт ${brand}`,
            "full_description": `Шкаф управления с преобразователем частоты для электродвигателя мощностью ${power} кВт, выполнен на базе преобразователей частоты ${brand}.`,
            "documentation": [certificate],
            "specs": {
                "Артикул": `ШУ-ПЧ-${powerStr}-1-РОСЭК`,
                "Производитель": brand,
                "Количество вводов": "1",
                "Мощность двигателя": `${power} кВт`,
                "Количество фаз": "3",
                "Степень защиты": "IP31"
            }
        };
        
        data.products.push(product);
        currentId++;
        addedCount++;
    });
});

// Сохраняем обновленный JSON
fs.writeFileSync('data/products.json', JSON.stringify(data, null, 4), 'utf8');

console.log(`Добавлено ${addedCount} товаров с преобразователем частоты`);
console.log(`Дополнительные бренды: ${additionalBrands.join(', ')}`);
console.log(`Мощности: ${powers.join(', ')} кВт`);
console.log(`ID с ${maxId + 1} по ${currentId - 1}`);
console.log(`Всего товаров с преобразователем частоты: ${48 + addedCount} (48 + ${addedCount})`);