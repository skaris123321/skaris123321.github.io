const fs = require('fs');

// Номинальные токи
const nominalCurrents = [0.6, 1, 1.6, 2.5, 4, 6, 8, 10, 12, 16, 25, 32, 40, 50, 63, 80];

// Типы однофидерных ящиков
const feederTypes = [
    {
        code: 'no_auto',
        name: 'без переключателя на автоматический режим',
        shortName: 'без переключателя'
    },
    {
        code: 'no_auto_contacts',
        name: 'без переключателя на автоматический режим, с контактами состояния на авт. выключателе',
        shortName: 'без переключателя, с контактами'
    },
    {
        code: 'with_auto',
        name: 'с переключателем на автоматический режим',
        shortName: 'с переключателем'
    }
];

// Бренды
const brands = ['IEK', 'TDM', 'EKF'];

// Функция для определения размеров
function getDimensions(current) {
    if (current <= 25) {
        return { width: 310, height: 395 };
    } else {
        return { width: 400, height: 500 };
    }
}

// Функция для форматирования тока в артикуле
function formatCurrentForArticle(current) {
    return current.toString().replace('.', ',');
}

// Функция для генерации артикула
function generateArticle(brand, current, feederType) {
    const currentStr = formatCurrentForArticle(current);
    let suffix = '';
    
    if (feederType.code === 'no_auto') {
        suffix = '';
    } else if (feederType.code === 'no_auto_contacts') {
        suffix = '-К';
    } else if (feederType.code === 'with_auto') {
        suffix = '-А';
    }
    
    return `Я5111-${currentStr}${suffix}-${brand}`;
}

// Функция для расчета базовой цены (примерная)
function calculatePrice(current, feederType, brand) {
    let basePrice = 10000;
    
    // Цена зависит от тока
    if (current <= 2.5) {
        basePrice = 12000;
    } else if (current <= 10) {
        basePrice = 15000;
    } else if (current <= 25) {
        basePrice = 18000;
    } else if (current <= 50) {
        basePrice = 22000;
    } else {
        basePrice = 28000;
    }
    
    // Надбавка за тип
    if (feederType.code === 'no_auto_contacts') {
        basePrice += 2000;
    } else if (feederType.code === 'with_auto') {
        basePrice += 3000;
    }
    
    // Коэффициент бренда
    const brandMultiplier = {
        'IEK': 1.0,
        'TDM': 1.05,
        'EKF': 1.1
    };
    
    return Math.round(basePrice * brandMultiplier[brand]);
}

// Генерируем все товары
const products = [];
let idCounter = 1;

brands.forEach(brand => {
    nominalCurrents.forEach(current => {
        feederTypes.forEach(feederType => {
            const dimensions = getDimensions(current);
            const article = generateArticle(brand, current, feederType);
            const price = calculatePrice(current, feederType, brand);
            
            const product = {
                article: article,
                nominal_current: current,
                brand: brand,
                commutation_type: "motor_control_box",
                box_type: "single_feeder",
                feeder_type: feederType.code,
                reversible: false,
                base_price: price,
                description: `Ящик управления Я5111 однофидерный ${feederType.shortName} ${current}А ${brand}`,
                full_description: `Ящик управления электродвигателем Я5111 однофидерный нереверсивный ${feederType.name}, номинальный ток ${current}А, производитель ${brand}`,
                main_image: "images/upr-ilektr.png",
                documentation: [
                    {
                        name: "Сертификат НКУ (ТР ТС) 2024-2029",
                        url: "../documents/Сертификат НКУ (ТР ТС) 2024-2029.pdf",
                        size: 1251760,
                        type: "pdf"
                    }
                ],
                specs: {
                    "Номинальный ток": `${current}А`,
                    "Тип": "Однофидерный нереверсивный",
                    "Количество фидеров": `Однофидерный, ${feederType.name}`,
                    "Ширина, мм": dimensions.width,
                    "Высота, мм": dimensions.height,
                    "Степень защиты корпуса": "IP54",
                    "Производитель": brand
                }
            };
            
            products.push(product);
        });
    });
});

// Сохраняем в файл
fs.writeFileSync('single_feeder_noreversible.json', JSON.stringify(products, null, 4), 'utf8');

console.log(`✓ Создано ${products.length} товаров`);
console.log(`  - Брендов: ${brands.length}`);
console.log(`  - Токов: ${nominalCurrents.length}`);
console.log(`  - Типов фидеров: ${feederTypes.length}`);
console.log(`  - Итого: ${brands.length} × ${nominalCurrents.length} × ${feederTypes.length} = ${products.length}`);
console.log('\nФайл сохранен: single_feeder_noreversible.json');
console.log('\nДля добавления в базу выполните:');
console.log('node add_products_to_category.js motor-control-boxes single_feeder_noreversible.json');
