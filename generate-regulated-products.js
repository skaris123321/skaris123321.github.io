// Скрипт для генерации автоматически регулируемых конденсаторных установок
const fs = require('fs');

const brands = ['CHINT', 'Systeme electric', 'EKF', 'TDM', 'Dekraft'];

// Данные из таблицы: мощность, ток, габариты, вес, ступень
const products = [
  { power: 15, current: 22, dimensions: '800x440x270/900x440x270', weight: 30, step: 1 },
  { power: 15, current: 22, dimensions: '800x440x270/900x440x270', weight: 31, step: 5 },
  { power: 25, current: 36, dimensions: '800x440x270/900x440x270', weight: 31, step: 5 },
  { power: 25, current: 40, dimensions: '800x440x270/900x440x270', weight: 33, step: 5 },
  { power: 40, current: 58, dimensions: '800x440x270/900x440x270', weight: 34, step: 5 },
  { power: 50, current: 72, dimensions: '800x440x270/900x440x270', weight: 35, step: 5 },
  { power: 50, current: 72, dimensions: '800x440x270/900x440x270', weight: 38, step: 10 },
  { power: 50, current: 72, dimensions: '800x440x270/900x440x270', weight: 39, step: 25 },
  { power: 75, current: 108, dimensions: '800x440x270/900x440x270', weight: 42, step: 15 },
  { power: 75, current: 108, dimensions: '800x440x270/900x440x270', weight: 43, step: 25 },
  { power: 80, current: 115, dimensions: '800x440x270/900x440x270', weight: 45, step: 10 },
  { power: 90, current: 130, dimensions: '800x440x270/900x440x270', weight: 47, step: 10 },
  { power: 100, current: 144, dimensions: '800x440x270/900x440x270', weight: 48, step: 10 },
  { power: 100, current: 144, dimensions: '800x440x270/900x440x270', weight: 49, step: 20 },
  { power: 100, current: 144, dimensions: '800x440x270/900x440x270', weight: 49, step: 25 },
  { power: 125, current: 180, dimensions: '1150x600x450/1250x600x450', weight: 63, step: 25 },
  { power: 140, current: 202, dimensions: '1150x600x450/1250x600x450', weight: 67, step: 20 },
  { power: 150, current: 216, dimensions: '1150x600x450/1250x600x450', weight: 67, step: 25 },
  { power: 150, current: 216, dimensions: '1150x600x450/1250x600x450', weight: 69, step: 30 },
  { power: 150, current: 216, dimensions: '1150x600x450/1250x600x450', weight: 70, step: 50 },
  { power: 150, current: 230, dimensions: '1150x600x450/1250x600x450', weight: 72, step: 20 },
  { power: 175, current: 252, dimensions: '1150x600x450/1250x600x450', weight: 78, step: 25 },
  { power: 180, current: 259, dimensions: '1150x600x450/1250x600x450', weight: 85, step: 20 },
  { power: 180, current: 259, dimensions: '1150x600x450/1250x600x450', weight: 90, step: 30 },
  { power: 200, current: 288, dimensions: '1150x600x450/1250x600x450', weight: 93, step: 25 },
  { power: 200, current: 288, dimensions: '1150x600x450/1250x600x450', weight: 96, step: 50 },
  { power: 225, current: 324, dimensions: '1150x600x450/1250x600x450', weight: 100, step: 25 },
  { power: 250, current: 360, dimensions: '1150x600x450/1250x600x450', weight: 108, step: 25 },
  { power: 250, current: 360, dimensions: '1150x600x450/1250x600x450', weight: 110, step: 50 },
  { power: 275, current: 396, dimensions: '1800x600x600/1900x600x600', weight: 120, step: 25 },
  { power: 300, current: 432, dimensions: '1800x600x600/1900x600x600', weight: 125, step: 25 },
  { power: 300, current: 432, dimensions: '1800x600x600/1900x600x600', weight: 129, step: 50 },
  { power: 325, current: 468, dimensions: '1800x600x600/1900x600x600', weight: 130, step: 25 },
  { power: 350, current: 504, dimensions: '1800x600x600/1900x600x600', weight: 137, step: 25 },
  { power: 350, current: 504, dimensions: '1800x600x600/1900x600x600', weight: 142, step: 50 },
  { power: 375, current: 540, dimensions: '1800x600x600/1900x600x600', weight: 150, step: 25 },
  { power: 400, current: 576, dimensions: '1800x600x600/1900x600x600', weight: 167, step: 25 },
  { power: 400, current: 576, dimensions: '1800x600x600/1900x600x600', weight: 175, step: 50 },
  { power: 425, current: 612, dimensions: '1800x600x600/1900x600x600', weight: 179, step: 25 },
  { power: 450, current: 648, dimensions: '1800x600x600/1900x600x600', weight: 185, step: 25 },
  { power: 450, current: 648, dimensions: '1800x600x600/1900x600x600', weight: 184, step: 50 },
  { power: 475, current: 684, dimensions: '1800x600x600/1900x600x600', weight: 187, step: 25 },
  { power: 500, current: 720, dimensions: '1800x600x600/1900x600x600', weight: 190, step: 25 },
  { power: 500, current: 720, dimensions: '1800x600x600/1900x600x600', weight: 195, step: 50 },
  { power: 525, current: 756, dimensions: '1800x600x600/1900x600x600', weight: 197, step: 25 },
  { power: 550, current: 792, dimensions: '1800x600x600/1900x600x600', weight: 200, step: 25 },
  { power: 550, current: 792, dimensions: '1800x600x600/1900x600x600', weight: 202, step: 50 },
  { power: 575, current: 828, dimensions: '1800x600x600/1900x600x600', weight: 205, step: 25 },
  { power: 600, current: 864, dimensions: '1800x600x600/1900x600x600', weight: 210, step: 50 }
];

// Базовые цены для каждого бренда (коэффициенты)
const brandPriceMultipliers = {
  'CHINT': 1.0,
  'Systeme electric': 1.15,
  'EKF': 0.95,
  'TDM': 0.90,
  'Dekraft': 0.85
};

let startId = 921; // Начинаем после последнего нерегулируемого товара (920)
const generatedProducts = [];

brands.forEach(brand => {
  products.forEach(product => {
    const basePrice = Math.round((50000 + product.power * 1000 + product.step * 500) * brandPriceMultipliers[brand]);
    
    const productObj = {
      id: startId++,
      article: `АУКРМ-0,4-${product.power}-${product.step}-РОСЭК`,
      power: product.power,
      brand: brand,
      commutation_type: 'reactive_power',
      regulation_type: 'regulated',
      step: product.step,
      base_price: basePrice,
      main_image: 'images/nky.jpg',
      images: ['images/nky.jpg', 'images/nky2.jpg'],
      description: `Автоматически регулируемая конденсаторная установка ${product.power} кВАр`,
      fullDescription: `Автоматически регулируемая конденсаторная установка мощностью ${product.power} кВАр с ${product.step} ступенями регулирования. Предназначена для компенсации реактивной мощности в электрических сетях.`,
      specs: {
        'Артикул': `АУКРМ-0,4-${product.power}-${product.step}-РОСЭК`,
        'Производитель': brand,
        'Мощность, кВАр': product.power.toString(),
        'Ток, Iном. А': product.current.toString(),
        'Габариты (ВхШхГ), мм': product.dimensions,
        'Вес, кг': `от ${product.weight}`,
        'Количество ступеней': product.step.toString()
      }
    };
    
    generatedProducts.push(productObj);
  });
});

// Читаем существующий файл
const productsData = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

// Добавляем новые товары
productsData.push(...generatedProducts);

// Сохраняем обратно
fs.writeFileSync('data/products.json', JSON.stringify(productsData, null, 2), 'utf8');

console.log(`Добавлено ${generatedProducts.length} товаров (ID ${921}-${startId-1})`);
console.log(`Всего товаров в базе: ${productsData.length}`);
