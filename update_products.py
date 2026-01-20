import json
import os

# Читаем текущие данные
with open('data/products.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Бренды для которых нужно добавить контакторы
brands = ['CHINT', 'EKF', 'Dekraft', 'TDM']

# Номинальные токи для контакторов (только 2 ввода)
nominal_currents = [25, 32, 40, 63, 80, 100, 125, 160, 200, 250, 400, 630, 800]

# Находим максимальный ID
max_id = max(p['id'] for p in data['products'])

# Удаляем все моноблочные АВР у IEK
original_count = len(data['products'])
data['products'] = [p for p in data['products'] if not (p['brand'] == 'IEK' and p['commutation_type'] == 'monoblock')]
removed_count = original_count - len(data['products'])

print(f'Удалено {removed_count} моноблочных АВР у IEK')

# Добавляем контакторные АВР для всех брендов
added_count = 0

for brand in brands:
    for current in nominal_currents:
        # Проверяем, есть ли уже такой контакторный АВР
        exists = any(
            p['brand'] == brand and 
            p['commutation_type'] == 'contactors' and 
            p['nominal_current'] == current and 
            p['inputs_count'] == '2'
            for p in data['products']
        )

        if not exists:
            max_id += 1
            
            # Находим базовую цену из моноблочного аналога
            monoblock_analog = next((
                p for p in data['products'] 
                if p['brand'] == brand and 
                   p['commutation_type'] == 'monoblock' and 
                   p['nominal_current'] == current and 
                   p['inputs_count'] == '2'
            ), None)

            base_price = monoblock_analog['base_price'] if monoblock_analog else current * 1000

            # Определяем габариты в зависимости от тока
            if current <= 63:
                dimensions = "600х500х250 мм"
            elif current <= 125:
                dimensions = "800х600х300 мм"
            else:
                dimensions = "900х700х350 мм"

            new_product = {
                "id": max_id,
                "article": f"АВР-{current}-{brand}-2-K",
                "nominal_current": current,
                "brand": brand,
                "commutation_type": "contactors",
                "inputs_count": "2",
                "base_price": base_price,
                "main_image": "images/avr-100.jpg",
                "images": ["images/avr-100.jpg"],
                "description": f"Шкаф АВР {current}А на базе {brand} (контакторы), 2 ввода",
                "full_description": f"Трёхфазный АВР {current}А на 2 ввода, выполнен на базе контакторов {brand} {current}А.",
                "documentation": [],
                "specs": {
                    "Габариты": dimensions,
                    "Номинальный ток": f"{current}А",
                    "Номинальное рабочее напряжение": "380 В",
                    "Степень защиты корпуса": "IP31"
                }
            }

            data['products'].append(new_product)
            added_count += 1
            print(f'Добавлен: АВР-{current}-{brand}-2-K')

# Сортируем продукты по ID
data['products'].sort(key=lambda x: x['id'])

# Записываем обновленные данные
with open('data/products.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'\n✅ Обновление завершено!')
print(f'Всего товаров: {len(data["products"])}')
print(f'Добавлено {added_count} контакторных АВР для всех брендов')
print(f'Удалено {removed_count} моноблочных АВР у IEK')