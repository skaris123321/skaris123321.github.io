// Скрипт для генерации однофидерных реверсивных ящиков управления Я5000
const fs = require('fs');

// Читаем текущий файл с товарами
const productsFile = './data/products-motor-control-boxes.json';
const data = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

// Бренды
const brands = ['IEK', 'TDM', 'EKF'];

// Номинальные токи
const nominalCurrents = [0.6, 1, 1.6, 2.5, 4, 6, 8, 10, 12, 16, 25, 32, 40, 50, 63, 80];

// Типы фидеров (для реверсивных нет варианта с контактами)
const feederTypes = [
  { type: 'no_auto', suffix: '', name: 'без переключателя на автоматический режим' },
  { type: 'with_auto', suffix: '-А', name: 'с переключателем на автоматический режим' }
];

// Функция для определения размеров
function getDimensions(current) {
  if (current <= 25) {
    return { width: 310, height: 395 };
  } else {
    return { width: 400, height: 500 };
  }
}

// Функция для расчета цены
function calculatePrice(brand, current, feederType) {
  let basePrice = 12000;
  
  // Увеличение цены в зависимости от тока
  if (current <= 1) basePrice = 12000;
  else if (current <= 2.5) basePrice = 13000;
  else if (current <= 6) basePrice = 14500;
  else if (current <= 12) basePrice = 16000;
  else if (current <= 25) basePrice = 18500;
  else if (current <= 40) basePrice = 22000;
  else if (current <= 63) basePrice = 26000;
  else basePrice = 32000;
  
  // Реверсивные дороже на 20%
  basePrice = Math.round(basePrice * 1.2);
  
  // Надбавка за переключатель
  if (feederType === 'with_auto') {
    basePrice += 2000;
  }
  
  // Надбавка за бренд
  if (brand === 'IEK') {
    basePrice = Math.round(basePrice * 1.0);
  } else if (brand === 'TDM') {
    basePrice = Math.round(basePrice * 1.05);
  } else if (brand === 'EKF') {
    basePrice = Math.round(basePrice * 1.1);
  }
  
  return basePrice;
}

// Находим максимальный ID
let maxId = Math.max(...data.products.map(p => p.id || 0));

// Генерируем товары
const newProducts = [];

for (const brand of brands) {
  for (const current of nominalCurrents) {
    for (const feeder of feederTypes) {
      maxId++;
      
      const dimensions = getDimensions(current);
      const price = calculatePrice(brand, current, feeder.type);
      
      // Формируем артикул
      const article = `Я5111-${current}${feeder.suffix}-РОСЭК`;
      
      const product = {
        id: maxId,
        article: article,
        nominal_current: current,
        brand: brand,
        commutation_type: "motor_control_box",
        box_type: "single_feeder",
        feeder_type: feeder.type,
        reversible: true,
        base_price: price,
        description: `Ящик управления Я5111 однофидерный реверсивный ${feeder.name} ${current}А ${brand}`,
        full_description: `Ящик управления электродвигателем Я5111 однофидерный реверсивный ${feeder.name}, номинальный ток ${current}А, производитель ${brand}`,
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
          "Номинальный ток щитка, А": current,
          "Тип ящика": "Однофидерный",
          "Тип регулирования": "Реверсивный",
          "Количество фидеров": feeder.name.charAt(0).toUpperCase() + feeder.name.slice(1),
          "Ширина, мм": dimensions.width,
          "Высота, мм": dimensions.height,
          "Глубина, мм": 220,
          "Степень защиты": "IP54",
          "Климатическое исполнение": "УХЛ4",
          "Производитель": brand
        }
      };
      
      newProducts.push(product);
    }
  }
}

console.log(`Сгенерировано ${newProducts.length} новых товаров`);
console.log(`Бренды: ${brands.length}, Токи: ${nominalCurrents.length}, Типы фидеров: ${feederTypes.length}`);
console.log(`Ожидается: ${brands.length * nominalCurrents.length * feederTypes.length} товаров`);

// Добавляем новые товары к существующим
data.products.push(...newProducts);

// Сохраняем обновленный файл
fs.writeFileSync(productsFile, JSON.stringify(data, null, 4), 'utf8');

console.log(`\nФайл ${productsFile} обновлен`);
console.log(`Всего товаров в базе: ${data.products.length}`);
console.log(`Новых товаров добавлено: ${newProducts.length}`);
