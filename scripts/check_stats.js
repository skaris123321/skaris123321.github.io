const data = require('./data/products-motor-control-boxes.json');

console.log('=== СТАТИСТИКА ТОВАРОВ ===');
console.log('Всего товаров:', data.products.length);

console.log('\nПо типам ящиков:');
const byBoxType = {};
data.products.forEach(p => {
  const key = p.box_type;
  byBoxType[key] = (byBoxType[key] || 0) + 1;
});
Object.entries(byBoxType).forEach(([type, count]) => console.log(`  ${type}: ${count}`));

console.log('\nПо реверсивности:');
const byReversible = {};
data.products.forEach(p => {
  const key = p.reversible ? 'Реверсивные' : 'Нереверсивные';
  byReversible[key] = (byReversible[key] || 0) + 1;
});
Object.entries(byReversible).forEach(([type, count]) => console.log(`  ${type}: ${count}`));

console.log('\nПо комбинациям:');
const byCombination = {};
data.products.forEach(p => {
  const key = `${p.box_type} ${p.reversible ? 'реверсивные' : 'нереверсивные'}`;
  byCombination[key] = (byCombination[key] || 0) + 1;
});
Object.entries(byCombination).forEach(([type, count]) => console.log(`  ${type}: ${count}`));
