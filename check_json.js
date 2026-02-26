const fs = require('fs');

try {
    const content = fs.readFileSync('data/products.json', 'utf8');
    const data = JSON.parse(content);
    
    const motorBoxes = data.products.filter(p => p.commutation_type === 'motor_control_box');
    console.log('Всего ящиков управления:', motorBoxes.length);
    
    const byBoxType = {};
    motorBoxes.forEach(p => {
        byBoxType[p.box_type] = (byBoxType[p.box_type] || 0) + 1;
    });
    console.log('По типам:', byBoxType);
    
    const byBrand = {};
    motorBoxes.forEach(p => {
        byBrand[p.brand] = (byBrand[p.brand] || 0) + 1;
    });
    console.log('По брендам:', byBrand);
    
    // Пересохраняем файл в правильном формате
    fs.writeFileSync('data/products.json', JSON.stringify(data, null, 4), 'utf8');
    console.log('\nФайл пересохранен в правильном формате');
    
} catch (error) {
    console.error('Ошибка:', error.message);
    console.error('\nПопытка исправить файл...');
    
    // Читаем файл и пытаемся исправить
    let content = fs.readFileSync('data/products.json', 'utf8');
    
    // Удаляем переносы строк внутри строковых значений
    // Это упрощенный подход - может не сработать для всех случаев
    console.log('Файл прочитан, размер:', content.length);
}
