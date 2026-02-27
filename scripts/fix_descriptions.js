const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./data/products-motor-control-boxes.json', 'utf8'));

console.log('Обновляем описания товаров...\n');

let updated = 0;

data.products.forEach(product => {
  const { box_type, reversible, nominal_current, feeder_type, brand, article } = product;
  
  // Определяем тип ящика
  let boxTypeName = '';
  if (box_type === 'single_feeder') {
    boxTypeName = 'однофидерный';
  } else if (box_type === 'double_feeder') {
    boxTypeName = 'двухфидерный';
  } else if (box_type === 'triple_feeder') {
    boxTypeName = 'трехфидерный';
  }
  
  // Определяем тип регулирования
  const regulationType = reversible ? 'реверсивный' : 'нереверсивный';
  
  // Определяем тип фидера
  let feederTypeName = '';
  if (feeder_type === 'no_auto') {
    feederTypeName = 'без переключателя';
  } else if (feeder_type === 'no_auto_contacts') {
    feederTypeName = 'без переключателя, с контактами';
  } else if (feeder_type === 'with_auto') {
    feederTypeName = 'с переключателем';
  } else if (feeder_type === 'triple_fixed') {
    feederTypeName = ''; // Для трехфидерных не указываем тип фидера
  }
  
  // Формируем новое описание
  let newDescription = `Ящик управления Я5000 ${boxTypeName} ${regulationType}`;
  if (feederTypeName) {
    newDescription += ` ${feederTypeName}`;
  }
  newDescription += ` ${nominal_current}А на базе ${brand}`;
  
  // Обновляем если описание изменилось
  if (product.description !== newDescription) {
    product.description = newDescription;
    updated++;
  }
});

console.log(`Обновлено описаний: ${updated}`);
console.log(`Всего товаров: ${data.products.length}`);

// Сохраняем
fs.writeFileSync('./data/products-motor-control-boxes.json', JSON.stringify(data, null, 4), 'utf8');

console.log('\n✓ Файл обновлен');

// Показываем примеры
console.log('\nПримеры новых описаний:');
data.products.slice(0, 5).forEach(p => {
  console.log(`  ${p.article}: ${p.description}`);
});
