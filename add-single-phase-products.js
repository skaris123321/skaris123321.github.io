const fs = require('fs');

// Читаем существующий JSON
const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

// Находим максимальный ID
const maxId = Math.max(...data.products.map(p => p.id));
let currentId = maxId + 1;

// Создаем товары для однофазных АВР на контакторах
const brands = ['CHINT', 'EKF', 'Dekraft', 'IEK', 'TDM'];
const currents = [12, 16, 20, 25, 32, 40, 50, 63];
const enclosures = ['19inch', 'wall']; // 19 дюймов, навесной
const connections = ['poles', 'terminals']; // к полюсам, на клеммы
const climates = ['UHL4', 'U2']; // УХЛ4, У2

const newProducts = [];

brands.forEach(brand => {
  currents.forEach(current => {
    enclosures.forEach(enclosure => {
      connections.forEach(connection => {
        climates.forEach(climate => {
          // УХЛ4 только для 19 дюймов
          if (climate === 'UHL4' && enclosure !== '19inch') {
            return;
          }

          // Базовые цены по брендам
          const basePrices = {
            'CHINT': {
              12: 15000, 16: 16000, 20: 17000, 25: 18000,
              32: 20000, 40: 22000, 50: 25000, 63: 28000
            },
            'EKF': {
              12: 14000, 16: 15000, 20: 16000, 25: 17000,
              32: 19000, 40: 21000, 50: 24000, 63: 27000
            },
            'Dekraft': {
              12: 13000, 16: 14000, 20: 15000, 25: 16000,
              32: 18000, 40: 20000, 50: 23000, 63: 26000
            },
            'IEK': {
              12: 16000, 16: 17000, 20: 18000, 25: 19000,
              32: 21000, 40: 23000, 50: 26000, 63: 29000
            },
            'TDM': {
              12: 12000, 16: 13000, 20: 14000, 25: 15000,
              32: 17000, 40: 19000, 50: 22000, 63: 25000
            }
          };

          let basePrice = basePrices[brand][current];
          
          // Доплаты
          if (connection === 'terminals') basePrice += 1000; // за клеммы
          if (climate === 'U2') basePrice += 23000; // за уличное исполнение

          const enclosureText = enclosure === '19inch' ? '19"' : 'навесной';
          const connectionText = connection === 'poles' ? 'полюса' : 'клеммы';
          const climateText = climate === 'UHL4' ? 'УХЛ4' : 'У2';

          const product = {
            id: currentId++,
            article: `АВР-1Ф-${current}-К-${brand}`,
            nominal_current: current,
            brand: brand,
            commutation_type: "single_phase_contactors",
            inputs_count: "2",
            enclosure_type: enclosure,
            connection_type: connection,
            climate_type: climate,
            base_price: basePrice,
            main_image: "images/avr-kont.jpg",
            images: ["images/avr-kont.jpg", "images/avr-kont2.jpg"],
            description: `Однофазный АВР ${current}А на базе ${brand} (контакторы), ${enclosureText}, ${climateText}`,
            full_description: `Однофазный автоматический ввод резерва ${current}А на 2 ввода, выполнен на базе контакторов ${brand} ${current}А. Корпус: ${enclosureText}, подключение: ${connectionText}, климатическое исполнение: ${climateText}.`,
            documentation: [],
            specs: {
              "Габариты": enclosure === '19inch' ? "482х44х300 мм" : "300х200х150 мм",
              "Номинальный ток": `${current}А`,
              "Номинальное рабочее напряжение": "220 В",
              "Частота": "50 Гц",
              "Время переключения": "не более 3 сек",
              "Степень защиты корпуса": enclosure === '19inch' ? "IP20" : "IP31",
              "Климатическое исполнение": climateText,
              "Корпус": enclosureText,
              "Подключение": connectionText
            }
          };

          newProducts.push(product);
        });
      });
    });
  });
});

// Добавляем новые товары к существующим
data.products.push(...newProducts);

// Записываем обновленный JSON
fs.writeFileSync('data/products.json', JSON.stringify(data, null, 2), 'utf8');

console.log(`Добавлено ${newProducts.length} товаров для однофазных АВР на контакторах`);
console.log(`Общее количество товаров: ${data.products.length}`);