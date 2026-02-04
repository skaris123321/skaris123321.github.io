const fs = require('fs');

const fileContent = fs.readFileSync('data/products.json', 'utf8');
const jsonData = JSON.parse(fileContent);
const data = jsonData.products;
const contactors = data.filter(p => p.commutation_type === 'contactors');

const problematic = contactors.filter(p => {
  if (!p.specs) return false;
  const specs = p.specs;
  return Object.keys(specs).some(key => 
    key === 'IP' || 
    key === 'Nominal_current' || 
    key === 'Gabarity' ||
    (typeof specs[key] === 'string' && (
      specs[key].includes(' mm') ||
      specs[key].includes('x500x') ||
      specs[key].match(/^\d+A$/)
    ))
  );
});

console.log('Найдено контакторов с проблемными спецификациями:', problematic.length);
if (problematic.length > 0) {
  console.log('Примеры проблемных записей:');
  problematic.slice(0, 5).forEach(p => {
    console.log('ID:', p.id, 'Артикул:', p.article);
    console.log('Спецификации:', JSON.stringify(p.specs, null, 2));
    console.log('---');
  });
}