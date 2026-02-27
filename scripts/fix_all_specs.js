const fs = require('fs');

// Единый порядок характеристик для всех товаров
const SPECS_ORDER = [
  'Артикул',
  'Производитель',
  'Номинальный ток',
  'Номинальный ток щитка, А',
  'Мощность двигателя',
  'Мощность, кВАр',
  'Тип',
  'Тип ящика',
  'Тип регулирования',
  'Тип управления',
  'Количество вводов',
  'Количество фидеров',
  'Количество насосов',
  'Количество фаз',
  'Количество ступеней',
  'Номинальное рабочее напряжение',
  'Ток, Iном. А',
  'Ширина, мм',
  'Высота, мм',
  'Глубина, мм',
  'Габариты',
  'Габариты (ВхШхГ), мм',
  'Вес, кг',
  'Степень защиты',
  'Степень защиты корпуса',
  'Климатическое исполнение'
];

function reorderSpecs(specs) {
  const ordered = {};
  
  // Сначала добавляем поля в правильном порядке
  SPECS_ORDER.forEach(key => {
    if (specs[key] !== undefined && specs[key] !== null && specs[key] !== '') {
      ordered[key] = specs[key];
    }
  });
  
  // Затем добавляем оставшиеся поля (если есть)
  Object.keys(specs).forEach(key => {
    if (!SPECS_ORDER.includes(key) && specs[key] !== undefined && specs[key] !== null && specs[key] !== '') {
      ordered[key] = specs[key];
    }
  });
  
  return ordered;
}

function fixCategory(filename, categoryName) {
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  let updated = 0;
  
  data.products.forEach(product => {
    if (product.specs) {
      const originalKeys = Object.keys(product.specs).join(',');
      product.specs = reorderSpecs(product.specs);
      const newKeys = Object.keys(product.specs).join(',');
      
      if (originalKeys !== newKeys) {
        updated++;
      }
    }
  });
  
  fs.writeFileSync(filename, JSON.stringify(data, null, 4), 'utf8');
  console.log(`${categoryName}: обновлено ${updated} из ${data.products.length}`);
  
  // Показываем пример
  if (data.products[0].specs) {
    console.log(`  Пример порядка полей: ${Object.keys(data.products[0].specs).join(', ')}`);
  }
}

console.log('Упорядочиваем характеристики всех товаров...\n');

fixCategory('./data/products-avr.json', 'АВР');
console.log();
fixCategory('./data/products-control-cabinets.json', 'Шкафы управления');
console.log();
fixCategory('./data/products-reactive-power.json', 'Компенсация реактивной мощности');
console.log();
fixCategory('./data/products-motor-control-boxes.json', 'Ящики управления');

console.log('\n✓ Все файлы обновлены');

// Показываем примеры
console.log('\n=== ПРИМЕРЫ ХАРАКТЕРИСТИК ===\n');

const avr = JSON.parse(fs.readFileSync('./data/products-avr.json', 'utf8'));
console.log('АВР:');
console.log(JSON.stringify(avr.products[0].specs, null, 2));

const cabinets = JSON.parse(fs.readFileSync('./data/products-control-cabinets.json', 'utf8'));
console.log('\nШкафы управления:');
console.log(JSON.stringify(cabinets.products[0].specs, null, 2));

const reactive = JSON.parse(fs.readFileSync('./data/products-reactive-power.json', 'utf8'));
console.log('\nКомпенсация реактивной мощности:');
console.log(JSON.stringify(reactive.products[0].specs, null, 2));

const boxes = JSON.parse(fs.readFileSync('./data/products-motor-control-boxes.json', 'utf8'));
console.log('\nЯщики управления:');
console.log(JSON.stringify(boxes.products[0].specs, null, 2));
