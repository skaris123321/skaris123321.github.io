import json

# Читаем файл
with open('data/products.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# TDM с контактами состояния (ID 1391-1405)
currents = [0.6, 1.6, 2.5, 4, 6, 8, 10, 12, 16, 25, 32, 40, 50, 63, 80]
start_id = 1391

for i, current in enumerate(currents):
    product_id = start_id + i
    
    # Определяем размеры и цену
    if current <= 25:
        width = 310
        height = 395
        price = 11000
    else:
        width = 400
        height = 500
        price = 15000 if current <= 50 else 20000
    
    product = {
        "id": product_id,
        "article": f"Я5000-1Ф-К-{current}-РОСЭК",
        "nominal_current": current,
        "brand": "TDM",
        "commutation_type": "motor_control_box",
        "box_type": "single_feeder",
        "motor_control_type": "non_reversible",
        "feeder_type": "single_no_auto_with_contacts",
        "base_price": price,
        "main_image": "images/upr-ilektr.png",
        "images": ["images/upr-ilektr.png"],
        "description": f"Ящик управления Я5000 на базе TDM однофидерный нереверсивный {current}А без переключателя, с контактами состояния",
        "full_description": f"Ящик управления электродвигателем Я5000 однофидерный нереверсивный, номинальный ток {current}А, без переключателя на автоматический режим, с контактами состояния на авт. выключателе.",
        "documentation": [{
            "url": "../documents/Сертификат НКУ (ТР ТС) 2024-2029.pdf",
            "name": "Сертификат НКУ (ТР ТС) 2024-2029",
            "size": 1251760
        }],
        "specs": {
            "Артикул": f"Я5000-1Ф-К-{current}-РОСЭК",
            "Производитель": "TDM",
            "Номинальный ток щитка, А": str(current),
            "Тип": "Однофидерный нереверсивный",
            "Количество фидеров": "Однофидерный, без переключателя на автоматический режим, с контактами состояния на авт. выключателе",
            "Ширина, мм": str(width),
            "Высота, мм": str(height)
        }
    }
    
    data["products"].append(product)

# Сохраняем
with open('data/products.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print(f"Добавлено 15 товаров TDM с контактами состояния (ID {start_id}-{start_id+14})")
