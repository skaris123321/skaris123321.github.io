// Скрипт для генерации трехфидерных нереверсивных ящиков управления Я5000
const fs = require('fs');

// Читаем текущий файл с товарами
const productsFile = './data/products-motor-control-boxes.json';
const data = JSON.parse(fs.readFileSync(productsFile, 'utf8'));

// Бренды
const brands = ['IEK', 'TDM', 'EKF'];

// Номинальные токи для трехфидерных нереверсивных
const nominalCurrents = [0.6, 1.6, 2.5, 4, 6, 8, 10, 12, 16];

// Для трехфидерных нет типов фидеров - это фиксированная конфигурация
// Используем специальное значение для обозначения отсутствия выбора
const feederType = 'triple_fixed'; // Фиксированная конфигурация для трехфидерных

// Функция для определения размеров
function getDimensions(current) {
  if (current <= 4) {
    return { width: 310, height: 395 };
  } else {
    return { width: 400, height: 500 };
  }
}

// Функция для расчета цены
function calculatePrice(brand, current) {
  let basePrice = 22000;
  
  // Увеличение цены в зависимости от тока
  if (current <= 1.6) basePrice = 22000;
  else if (current <= 4) basePrice = 25000;
  else if (current <= 8) basePrice = 30000;
  else if (current <= 12) basePrice = 36000;
  else basePrice = 44000;
  
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
    maxId++;
    
    const dimensions = getDimensions(current);
    const price = calculatePrice(brand, current);
    
    // Формируем артикул для трехфидерных: Я5131
    const article = `Я5131-${current}-РОСЭК`;
    
    const product = {
      id: maxId,
      article: article,
      nominal_current: current,
      brand: brand,
      commutation_type: "motor_control_box",
      box_type: "triple_feeder",
      feeder_type: feederType,
      reversible: false,
      base_price: price,
      description: `Ящик управления Я5131 трехфидерный нереверсивный ${current}А ${brand}`,
      full_description: `Ящик управления электродвигателем Я5131 трехфидерный нереверсивный, номинальный ток ${current}А, производитель ${brand}`,
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
        "Тип ящика": "Трехфидерный",
        "Тип регулирования": "Нереверсивный",
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

console.log(`Сгенерировано ${newProducts.length} новых товаров`);
console.log(`Бренды: ${brands.length}, Токи: ${nominalCurrents.length}`);
console.log(`Ожидается: ${brands.length * nominalCurrents.length} товаров`);

// Добавляем новые товары к существующим
data.products.push(...newProducts);

// Сохраняем обновленный файл
fs.writeFileSync(productsFile, JSON.stringify(data, null, 4), 'utf8');

console.log(`\nФайл ${productsFile} обновлен`);
console.log(`Всего товаров в базе: ${data.products.length}`);
console.log(`Новых товаров добавлено: ${newProducts.length}`);
