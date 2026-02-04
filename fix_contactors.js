const fs = require('fs');

// Читаем файл
const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

// Находим контакторы с проблемными спецификациями
const contactors = data.filter(p => p.commutation_type === 'contactors');
let fixedCount = 0;

contactors.forEach(product => {
  if (!product.specs) return;
  
  let needsUpdate = false;
  const newSpecs = {};
  
  Object.keys(product.specs).forEach(key => {
    const value = product.specs[key];
    
    // Переводим английские названия полей на русские
    if (key === 'IP') {
      newSpecs['Степень защиты корпуса'] = value;
      needsUpdate = true;
    } else if (key === 'Nominal_current') {
      // Исправляем единицы измерения A -> А
      const fixedValue = value.replace(/(\d+)A$/, '$1А');
      newSpecs['Номинальный ток'] = fixedValue;
      needsUpdate = true;
    } else if (key === 'Gabarity') {
      // Исправляем единицы измерения и символы
      const fixedValue = value.replace(/x/g, 'х').replace(/ mm$/, ' мм');
      newSpecs['Габариты'] = fixedValue;
      needsUpdate = true;
    } else if (key === 'Габариты' && typeof value === 'string') {
      // Исправляем единицы измерения в уже переведенных полях
      if (value.includes(' mm') || value.includes('x500x')) {
        const fixedValue = value.replace(/x/g, 'х').replace(/ mm$/, ' мм');
        newSpecs['Габариты'] = fixedValue;
        needsUpdate = true;
      } else {
        newSpecs[key] = value;
      }
    } else if (key === 'Номинальный ток' && typeof value === 'string') {
      // Исправляем единицы измерения в уже переведенных полях
      if (value.match(/^\d+A$/)) {
        const fixedValue = value.replace(/(\d+)A$/, '$1А');
        newSpecs['Номинальный ток'] = fixedValue;
        needsUpdate = true;
      } else {
        newSpecs[key] = value;
      }
    } else {
      newSpecs[key] = value;
    }
  });
  
  if (needsUpdate) {
    product.specs = newSpecs;
    fixedCount++;
    console.log(`Исправлен контактор ID ${product.id}: ${product.article}`);
  }
});

// Сохраняем файл
fs.writeFileSync('data/products.json', JSON.stringify(data, null, 4), 'utf8');

console.log(`\nВсего исправлено контакторов: ${fixedCount}`);