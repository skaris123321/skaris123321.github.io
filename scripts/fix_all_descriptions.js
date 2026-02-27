const fs = require('fs');

// Функция для обновления АВР
function fixAVR() {
  const data = JSON.parse(fs.readFileSync('./data/products-avr.json', 'utf8'));
  let updated = 0;
  
  data.products.forEach(product => {
    const { nominal_current, brand, inputs_count, commutation_type } = product;
    
    let newDescription = '';
    
    if (commutation_type === 'monoblock') {
      // Моноблочные АВР
      newDescription = `Шкаф АВР моноблочный ${nominal_current}А ${inputs_count} ввода на базе ${brand}`;
    } else if (commutation_type === 'contactors') {
      // Контакторные АВР
      const poles = product.poles_count === 'single_phase' ? 'однофазный' : 'трехфазный';
      newDescription = `Шкаф АВР контакторный ${poles} ${nominal_current}А ${inputs_count} ввода на базе ${brand}`;
    } else if (commutation_type === 'sectional') {
      // Секционные АВР
      newDescription = `Шкаф АВР секционный ${nominal_current}А ${inputs_count} ввода на базе ${brand}`;
    } else {
      // Остальные АВР
      newDescription = `Шкаф АВР ${nominal_current}А ${inputs_count} ввода на базе ${brand}`;
    }
    
    if (product.description !== newDescription) {
      product.description = newDescription;
      updated++;
    }
  });
  
  fs.writeFileSync('./data/products-avr.json', JSON.stringify(data, null, 4), 'utf8');
  console.log(`АВР: обновлено ${updated} из ${data.products.length}`);
}

// Функция для обновления шкафов управления
function fixControlCabinets() {
  const data = JSON.parse(fs.readFileSync('./data/products-control-cabinets.json', 'utf8'));
  let updated = 0;
  
  data.products.forEach(product => {
    const { motor_power, brand, control_type, start_type, pump_count } = product;
    
    let controlTypeName = '';
    if (control_type === 'soft_start') {
      controlTypeName = 'с плавным пуском';
    } else if (control_type === 'frequency_converter') {
      controlTypeName = 'с преобразователем частоты';
    } else if (control_type === 'direct_start') {
      if (start_type === 'direct_start') {
        controlTypeName = `прямой пуск ${pump_count} насос${pump_count > 1 ? 'а' : ''}`;
      } else if (start_type === 'star_delta') {
        controlTypeName = `звезда-треугольник ${pump_count} насос${pump_count > 1 ? 'а' : ''}`;
      }
    }
    
    const newDescription = `Шкаф управления ${controlTypeName} ${motor_power} кВт на базе ${brand}`;
    
    if (product.description !== newDescription) {
      product.description = newDescription;
      updated++;
    }
  });
  
  fs.writeFileSync('./data/products-control-cabinets.json', JSON.stringify(data, null, 4), 'utf8');
  console.log(`Шкафы управления: обновлено ${updated} из ${data.products.length}`);
}

// Функция для обновления компенсации реактивной мощности
function fixReactivePower() {
  const data = JSON.parse(fs.readFileSync('./data/products-reactive-power.json', 'utf8'));
  let updated = 0;
  
  data.products.forEach(product => {
    const { power, brand, regulation_type, step } = product;
    
    const regulationName = regulation_type === 'regulated' ? 'Автоматически регулируемая' : 'Нерегулируемая';
    
    let newDescription = `${regulationName} конденсаторная установка ${power} кВАр`;
    if (regulation_type === 'regulated' && step) {
      newDescription += ` ${step} ступеней`;
    }
    newDescription += ` на базе ${brand}`;
    
    if (product.description !== newDescription) {
      product.description = newDescription;
      updated++;
    }
  });
  
  fs.writeFileSync('./data/products-reactive-power.json', JSON.stringify(data, null, 4), 'utf8');
  console.log(`Компенсация реактивной мощности: обновлено ${updated} из ${data.products.length}`);
}

console.log('Обновляем описания всех товаров...\n');

fixAVR();
fixControlCabinets();
fixReactivePower();

console.log('\n✓ Все файлы обновлены');

// Показываем примеры
console.log('\n=== ПРИМЕРЫ НОВЫХ ОПИСАНИЙ ===\n');

const avr = JSON.parse(fs.readFileSync('./data/products-avr.json', 'utf8'));
console.log('АВР:');
avr.products.slice(0, 2).forEach(p => console.log(`  ${p.description}`));

const cabinets = JSON.parse(fs.readFileSync('./data/products-control-cabinets.json', 'utf8'));
console.log('\nШкафы управления:');
cabinets.products.slice(0, 2).forEach(p => console.log(`  ${p.description}`));

const reactive = JSON.parse(fs.readFileSync('./data/products-reactive-power.json', 'utf8'));
console.log('\nКомпенсация реактивной мощности:');
reactive.products.slice(0, 2).forEach(p => console.log(`  ${p.description}`));

const boxes = JSON.parse(fs.readFileSync('./data/products-motor-control-boxes.json', 'utf8'));
console.log('\nЯщики управления:');
boxes.products.slice(0, 2).forEach(p => console.log(`  ${p.description}`));
