# -*- coding: utf-8 -*-
import json

brands = ['CHINT', 'Systeme electric', 'EKF', 'TDM', 'Dekraft']

# Данные из таблицы: мощность, ток, габариты, вес, ступень
products = [
    {'power': 15, 'current': 22, 'dimensions': '800x440x270/900x440x270', 'weight': 30, 'step': 1},
    {'power': 15, 'current': 22, 'dimensions': '800x440x270/900x440x270', 'weight': 31, 'step': 5},
    {'power': 25, 'current': 36, 'dimensions': '800x440x270/900x440x270', 'weight': 31, 'step': 5},
    {'power': 25, 'current': 40, 'dimensions': '800x440x270/900x440x270', 'weight': 33, 'step': 5},
    {'power': 40, 'current': 58, 'dimensions': '800x440x270/900x440x270', 'weight': 34, 'step': 5},
    {'power': 50, 'current': 72, 'dimensions': '800x440x270/900x440x270', 'weight': 35, 'step': 5},
    {'power': 50, 'current': 72, 'dimensions': '800x440x270/900x440x270', 'weight': 38, 'step': 10},
    {'power': 50, 'current': 72, 'dimensions': '800x440x270/900x440x270', 'weight': 39, 'step': 25},
    {'power': 75, 'current': 108, 'dimensions': '800x440x270/900x440x270', 'weight': 42, 'step': 15},
    {'power': 75, 'current': 108, 'dimensions': '800x440x270/900x440x270', 'weight': 43, 'step': 25},
    {'power': 80, 'current': 115, 'dimensions': '800x440x270/900x440x270', 'weight': 45, 'step': 10},
    {'power': 90, 'current': 130, 'dimensions': '800x440x270/900x440x270', 'weight': 47, 'step': 10},
    {'power': 100, 'current': 144, 'dimensions': '800x440x270/900x440x270', 'weight': 48, 'step': 10},
    {'power': 100, 'current': 144, 'dimensions': '800x440x270/900x440x270', 'weight': 49, 'step': 20},
    {'power': 100, 'current': 144, 'dimensions': '800x440x270/900x440x270', 'weight': 49, 'step': 25},
    {'power': 125, 'current': 180, 'dimensions': '1150x600x450/1250x600x450', 'weight': 63, 'step': 25},
    {'power': 140, 'current': 202, 'dimensions': '1150x600x450/1250x600x450', 'weight': 67, 'step': 20},
    {'power': 150, 'current': 216, 'dimensions': '1150x600x450/1250x600x450', 'weight': 67, 'step': 25},
    {'power': 150, 'current': 216, 'dimensions': '1150x600x450/1250x600x450', 'weight': 69, 'step': 30},
    {'power': 150, 'current': 216, 'dimensions': '1150x600x450/1250x600x450', 'weight': 70, 'step': 50},
    {'power': 150, 'current': 230, 'dimensions': '1150x600x450/1250x600x450', 'weight': 72, 'step': 20},
    {'power': 175, 'current': 252, 'dimensions': '1150x600x450/1250x600x450', 'weight': 78, 'step': 25},
    {'power': 180, 'current': 259, 'dimensions': '1150x600x450/1250x600x450', 'weight': 85, 'step': 20},
    {'power': 180, 'current': 259, 'dimensions': '1150x600x450/1250x600x450', 'weight': 90, 'step': 30},
    {'power': 200, 'current': 288, 'dimensions': '1150x600x450/1250x600x450', 'weight': 93, 'step': 25},
    {'power': 200, 'current': 288, 'dimensions': '1150x600x450/1250x600x450', 'weight': 96, 'step': 50},
    {'power': 225, 'current': 324, 'dimensions': '1150x600x450/1250x600x450', 'weight': 100, 'step': 25},
    {'power': 250, 'current': 360, 'dimensions': '1150x600x450/1250x600x450', 'weight': 108, 'step': 25},
    {'power': 250, 'current': 360, 'dimensions': '1150x600x450/1250x600x450', 'weight': 110, 'step': 50},
    {'power': 275, 'current': 396, 'dimensions': '1800x600x600/1900x600x600', 'weight': 120, 'step': 25},
    {'power': 300, 'current': 432, 'dimensions': '1800x600x600/1900x600x600', 'weight': 125, 'step': 25},
    {'power': 300, 'current': 432, 'dimensions': '1800x600x600/1900x600x600', 'weight': 129, 'step': 50},
    {'power': 325, 'current': 468, 'dimensions': '1800x600x600/1900x600x600', 'weight': 130, 'step': 25},
    {'power': 350, 'current': 504, 'dimensions': '1800x600x600/1900x600x600', 'weight': 137, 'step': 25},
    {'power': 350, 'current': 504, 'dimensions': '1800x600x600/1900x600x600', 'weight': 142, 'step': 50},
    {'power': 375, 'current': 540, 'dimensions': '1800x600x600/1900x600x600', 'weight': 150, 'step': 25},
    {'power': 400, 'current': 576, 'dimensions': '1800x600x600/1900x600x600', 'weight': 167, 'step': 25},
    {'power': 400, 'current': 576, 'dimensions': '1800x600x600/1900x600x600', 'weight': 175, 'step': 50},
    {'power': 425, 'current': 612, 'dimensions': '1800x600x600/1900x600x600', 'weight': 179, 'step': 25},
    {'power': 450, 'current': 648, 'dimensions': '1800x600x600/1900x600x600', 'weight': 185, 'step': 25},
    {'power': 450, 'current': 648, 'dimensions': '1800x600x600/1900x600x600', 'weight': 184, 'step': 50},
    {'power': 475, 'current': 684, 'dimensions': '1800x600x600/1900x600x600', 'weight': 187, 'step': 25},
    {'power': 500, 'current': 720, 'dimensions': '1800x600x600/1900x600x600', 'weight': 190, 'step': 25},
    {'power': 500, 'current': 720, 'dimensions': '1800x600x600/1900x600x600', 'weight': 195, 'step': 50},
    {'power': 525, 'current': 756, 'dimensions': '1800x600x600/1900x600x600', 'weight': 197, 'step': 25},
    {'power': 550, 'current': 792, 'dimensions': '1800x600x600/1900x600x600', 'weight': 200, 'step': 25},
    {'power': 550, 'current': 792, 'dimensions': '1800x600x600/1900x600x600', 'weight': 202, 'step': 50},
    {'power': 575, 'current': 828, 'dimensions': '1800x600x600/1900x600x600', 'weight': 205, 'step': 25},
    {'power': 600, 'current': 864, 'dimensions': '1800x600x600/1900x600x600', 'weight': 210, 'step': 50}
]

# Базовые цены для каждого бренда (коэффициенты)
brand_price_multipliers = {
    'CHINT': 1.0,
    'Systeme electric': 1.15,
    'EKF': 0.95,
    'TDM': 0.90,
    'Dekraft': 0.85
}

start_id = 921
generated_products = []

for brand in brands:
    for product in products:
        base_price = round((50000 + product['power'] * 1000 + product['step'] * 500) * brand_price_multipliers[brand])
        
        product_obj = {
            'id': start_id,
            'article': f"АУКРМ-0,4-{product['power']}-{product['step']}-РОСЭК",
            'power': product['power'],
            'brand': brand,
            'commutation_type': 'reactive_power',
            'regulation_type': 'regulated',
            'step': product['step'],
            'base_price': base_price,
            'main_image': 'images/nky.jpg',
            'images': ['images/nky.jpg', 'images/nky2.jpg'],
            'description': f"Автоматически регулируемая конденсаторная установка {product['power']} кВАр",
            'fullDescription': f"Автоматически регулируемая конденсаторная установка мощностью {product['power']} кВАр с {product['step']} ступенями регулирования. Предназначена для компенсации реактивной мощности в электрических сетях.",
            'specs': {
                'Артикул': f"АУКРМ-0,4-{product['power']}-{product['step']}-РОСЭК",
                'Производитель': brand,
                'Мощность, кВАр': str(product['power']),
                'Ток, Iном. А': str(product['current']),
                'Габариты (ВхШхГ), мм': product['dimensions'],
                'Вес, кг': f"от {product['weight']}",
                'Количество ступеней': str(product['step'])
            }
        }
        
        generated_products.append(product_obj)
        start_id += 1

# Читаем существующий файл
with open('data/products.json', 'r', encoding='utf-8') as f:
    products_data = json.load(f)

# Добавляем новые товары
products_data.extend(generated_products)

# Сохраняем обратно
with open('data/products.json', 'w', encoding='utf-8') as f:
    json.dump(products_data, f, ensure_ascii=False, indent=2)

print(f"Добавлено {len(generated_products)} товаров (ID 921-{start_id-1})")
print(f"Всего товаров в базе: {len(products_data)}")
