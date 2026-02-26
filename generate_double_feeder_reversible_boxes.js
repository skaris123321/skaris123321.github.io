// Скрипт для генерации двухфидерных реверсивных ящиков управления Я5000
const fs = require('fs');

// Читаем текущий файл с товарами
const productsFile = './data/products-motor-control-boxes.json';
const data = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

// Бренды
const brands = ['IEK', 'TDM', 'EKF'];

// Номинальные токи (только для двухфидерных реверсивных)
const nominalCurrents = [1.6, 2.5, 4, 6, 8, 10, 12, 16];

// Типы фидеров (для двухфидерных реверсивных нет варианта с контактами)
const feederTypes = [
  { type: 'no_auto', suffix: '', name: 'без переключателя на автоматический режим' },
  { type: 'with_auto', suffix: '-А', name: 'с переключателем на автоматический режим' }
];

// Функция для расчета цены
function calculatePrice(brand, current, feederType) {
  let basePrice = 18000;
  
  // Увеличение цены в зависимости от тока
  if (current <= 2.5) basePrice = 18000;
  else if (current <= 6) basePrice = 21000;
  else if (current <= 12) basePrice = 25000;
  else basePrice = 30000;
  
  // Надбавка за переключатель
  if (feederType === 'with_auto') {
    basePrice += 3000;
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
      
      const price = calculatePrice(brand, current, feeder.type);
      
      // Формируем артикул для двухфидерных: Я5121
      const article = `Я5121-${current}${feeder.suffix}-РОСЭК`;
      
      const product = {
        id: maxId,
        article: article,
        nominal_current: current,
        brand: brand,
        commutation_type: "motor_control_box",
        box_type: "double_feeder",
        feeder_type: feeder.type,
        reversible: true,
        base_price: price,
        description: `Ящик управления Я5121 двухфидерный реверсивный ${feeder.name} ${current}А ${brand}`,
        full_description: `Ящик управления электродвигателем Я5121 двухфидерный реверсивный ${feeder.name}, номинальный ток ${current}А, производитель ${brand}`,
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
          "Тип ящика": "Двухфидерный",
          "Тип регулирования": "Реверсивный",
          "Количество фидеров": feeder.name.charAt(0).toUpperCase() + feeder.name.slice(1),
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
