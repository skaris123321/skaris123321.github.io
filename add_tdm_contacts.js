const fs = require('fs');

// Читаем файл
const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

// TDM с контактами состояния (ID 1391-1405)
const currents = [0.6, 1.6, 2.5, 4, 6, 8, 10, 12, 16, 25, 32, 40, 50, 63, 80];
const startId = 1391;

currents.forEach((current, i) => {
    const productId = startId + i;
    
    // Определяем размеры и цену
    let width, height, price;
    if (current <= 25) {
        width = 310;
        height = 395;
        price = 11000;
    } else {
        width = 400;
        height = 500;
        price = current <= 50 ? 15000 : 20000;
    }
    
    const product = {
        id: productId,
        article: `Я5000-1Ф-К-${current}-РОСЭК`,
        nominal_current: current,
        brand: "TDM",
        commutation_type: "motor_control_box",
        box_type: "single_feeder",
        motor_control_type: "non_reversible",
        feeder_type: "single_no_auto_with_contacts",
        base_price: price,
        main_image: "images/upr-ilektr.png",
        images: ["images/upr-ilektr.png"],
        description: `Ящик управления Я5000 на базе TDM однофидерный нереверсивный ${current}А без переключателя, с контактами состояния`,
        full_description: `Ящик управления электродвигателем Я5000 однофидерный нереверсивный, номинальный ток ${current}А, без переключателя на автоматический режим, с контактами состояния на авт. выключателе.`,
        documentation: [{
            url: "../documents/Сертификат НКУ (ТР ТС) 2024-2029.pdf",
            name: "Сертификат НКУ (ТР ТС) 2024-2029",
            size: 1251760
        }],
        specs: {
            "Артикул": `Я5000-1Ф-К-${current}-РОСЭК`,
            "Производитель": "TDM",
            "Номинальный ток щитка, А": String(current),
            "Тип": "Однофидерный нереверсивный",
            "Количество фидеров": "Однофидерный, без переключателя на автоматический режим, с контактами состояния на авт. выключателе",
            "Ширина, мм": String(width),
            "Высота, мм": String(height)
        }
    };
    
    data.products.push(product);
});

// Сохраняем
fs.writeFileSync('data/products.json', JSON.stringify(data, null, 4), 'utf8');

console.log(`Добавлено 15 товаров TDM с контактами состояния (ID ${startId}-${startId+14})`);
