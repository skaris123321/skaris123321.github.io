const fs = require('fs');

// Читаем текущие данные
const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

// Бренды для которых нужно добавить контакторы
const brands = ['CHINT', 'EKF', 'Dekraft', 'TDM'];

// Номинальные токи для контакторов (только 2 ввода)
const nominalCurrents = [25, 32, 40, 63, 80, 100, 125, 160, 200, 250, 400, 630, 800];

// Находим максимальный ID
let maxId = Math.max(...data.products.map(p => p.id));

// Удаляем все моноблочные АВР у IEK
data.products = data.products.filter(p => !(p.brand === 'IEK' && p.commutation_type === 'monoblock'));

console.log('Удалены моноблочные АВР у IEK');

// Добавляем контакторные АВР для всех брендов
brands.forEach(brand => {
  nominalCurrents.forEach(current => {
    // Проверяем, есть ли уже такой контакторный АВР
    const exists = data.products.some(p => 
      p.brand === brand && 
      p.commutation_type === 'contactors' && 
      p.nominal_current === current && 
      p.inputs_count === '2'
    );

    if (!exists) {
      maxId++;
      
      // Находим базовую цену из моноблочного аналога
      const monoblockAnalog = data.products.find(p => 
        p.brand === brand && 
        p.commutation_type === 'monoblock' && 
        p.nominal_current === current && 
        p.inputs_count === '2'
      );

      const basePrice = monoblockAnalog ? monoblockAnalog.base_price : current * 1000;

      const newProduct = {
        "id": maxId,
        "article": `АВР-${current}-${brand}-2-K`,
        "nominal_current": current,
        "brand": brand,
        "commutation_type": "contactors",
        "inputs_count": "2",
        "base_price": basePrice,
        "main_image": "images/avr-100.jpg",
        "images": ["images/avr-100.jpg"],
        "description": `Шкаф АВР ${current}А на базе ${brand} (контакторы), 2 ввода`,
        "full_description": `Трёхфазный АВР ${current}А на 2 ввода, выполнен на базе контакторов ${brand} ${current}А.`,
        "documentation": [],
        "specs": {
          "Габариты": current <= 63 ? "600х500х250 мм" : current <= 125 ? "800х600х300 мм" : "900х700х350 мм",
          "Номинальный ток": `${current}А`,
          "Номинальное рабочее напряжение": "380 В",
          "Степень защиты корпуса": "IP31"
        }
      };

      data.products.push(newProduct);
      console.log(`Добавлен: АВР-${current}-${brand}-2-K`);
    }
  });
});

// Сортируем продукты по ID
data.products.sort((a, b) => a.id - b.id);

// Записываем обновленные данные
fs.writeFileSync('data/products.json', JSON.stringify(data, null, 2), 'utf8');

console.log('\n✅ Обновление завершено!');
console.log(`Всего товаров: ${data.products.length}`);
console.log('Добавлены контакторные АВР для всех брендов');
console.log('Удалены моноблочные АВР у IEK');