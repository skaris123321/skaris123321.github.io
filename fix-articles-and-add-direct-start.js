const fs = require('fs');

// Читаем файл products.json
const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

console.log('Исправляем артикулы с подчеркиваниями...');

// Исправляем артикулы с подчеркиваниями на точки
data.products.forEach(product => {
    if (product.article && product.article.includes('_')) {
        const oldArticle = product.article;
        product.article = product.article.replace(/_/g, '.');
        console.log(`Исправлен артикул: ${oldArticle} -> ${product.article}`);
    }
});

console.log('Добавляем шкафы управления с прямым пуском...');

// Находим максимальный ID
let maxId = Math.max(...data.products.map(p => p.id));

// Параметры для новых товаров
const brands = ['CHINT', 'EKF', 'Dekraft', 'IEK', 'Systeme electric', 'TDM', 'VEDA'];
const powers = [1.5, 2.2, 3, 4, 5.5, 7.5, 11]; // кВт
const startTypes = ['direct_start', 'frequency_control', 'soft_start'];
const pumpCounts = [1, 2];

let addedCount = 0;

// Добавляем товары для каждой комбинации
brands.forEach(brand => {
    powers.forEach(power => {
        startTypes.forEach(startType => {
            pumpCounts.forEach(pumpCount => {
                maxId++;
                
                // Определяем тип пуска для артикула
                let startTypeCode = '';
                switch(startType) {
                    case 'direct_start':
                        startTypeCode = 'ПП'; // Прямой пуск
                        break;
                    case 'frequency_control':
                        startTypeCode = 'ЧР'; // Частотное регулирование
                        break;
                    case 'soft_start':
                        startTypeCode = 'ПП'; // Плавный пуск (тоже ПП)
                        break;
                }
                
                // Формируем артикул: ШУ-ПП-{количество насосов}-{мощность}-1-РОСЭК
                const powerStr = power.toString().replace('.', '.');
                const article = `ШУ-${startTypeCode}-${pumpCount}-${powerStr}-1-РОСЭК`;
                
                // Определяем название типа пуска
                let startTypeName = '';
                switch(startType) {
                    case 'direct_start':
                        startTypeName = 'прямым пуском';
                        break;
                    case 'frequency_control':
                        startTypeName = 'частотным регулированием';
                        break;
                    case 'soft_start':
                        startTypeName = 'плавным пуском';
                        break;
                }
                
                const pumpCountName = pumpCount === 1 ? '1 насос' : '2 насоса';
                
                const newProduct = {
                    "id": maxId,
                    "article": article,
                    "motor_power": power,
                    "brand": brand,
                    "commutation_type": "control_cabinet",
                    "control_type": "direct_start",
                    "start_type": startType,
                    "pump_count": pumpCount,
                    "inputs_count": "1",
                    "phases_count": "3",
                    "base_price": 45000 + (power * 1000) + (pumpCount * 5000), // Базовая цена зависит от мощности и количества насосов
                    "main_image": "images/ps.png", // Указанная картинка
                    "images": [
                        "images/ps.png"
                    ],
                    "description": `Шкаф управления с ${startTypeName} ${power} кВт ${brand} (${pumpCountName})`,
                    "full_description": `Шкаф управления с ${startTypeName} для электродвигателя мощностью ${power} кВт, ${pumpCountName}, выполнен на базе оборудования ${brand}.`,
                    "documentation": [
                        {
                            "name": "Сертификат НКУ (ТР ТС) 2024-2029",
                            "url": "../documents/Сертификат НКУ (ТР ТС) 2024-2029.pdf",
                            "size": 1251760,
                            "type": "pdf"
                        }
                    ],
                    "specs": {
                        "Артикул": article,
                        "Производитель": brand,
                        "Количество вводов": "1",
                        "Мощность двигателя": `${power} кВт`,
                        "Тип пуска": startTypeName,
                        "Количество насосов": pumpCount.toString(),
                        "Количество фаз": "3",
                        "Степень защиты": "IP31"
                    }
                };
                
                data.products.push(newProduct);
                addedCount++;
            });
        });
    });
});

console.log(`Добавлено ${addedCount} новых товаров с прямым пуском`);
console.log(`Общее количество товаров: ${data.products.length}`);

// Сохраняем обновленный файл
fs.writeFileSync('data/products.json', JSON.stringify(data, null, 4));

console.log('Файл products.json обновлен!');