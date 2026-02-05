const fs = require('fs');

console.log('Читаем файл как буфер...');
const buffer = fs.readFileSync('data/products.json');
console.log('Размер файла:', buffer.length, 'байт');

console.log('Читаем как UTF-8...');
const content = buffer.toString('utf8');

// Ищем конкретную строку
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('id": 543')) {
        console.log(`Строка ${i + 1}:`, lines[i]);
        console.log(`Следующие 5 строк:`);
        for (let j = 1; j <= 5 && i + j < lines.length; j++) {
            console.log(`${i + j + 1}:`, lines[i + j]);
        }
        break;
    }
}

// Проверяем наличие ШУ-ЧР- в файле
const matches = content.match(/ШУ-ЧР-/g);
console.log('Найдено вхождений ШУ-ЧР-:', matches ? matches.length : 0);

// Проверяем наличие ШУ-ПП- в файле  
const matches2 = content.match(/ШУ-ПП-/g);
console.log('Найдено вхождений ШУ-ПП-:', matches2 ? matches2.length : 0);