import json

# Токи
currents = [0.6, 1.6, 2.5, 4, 6, 8, 10, 12, 16, 25, 32, 40, 50, 63, 80]

# Бренды
brands = ["IEK", "TDM", "EKF"]

# Типы фидеров
feeder_types = [
    {
        "code": "single_no_auto",
        "name": "Однофидерный, без переключателя на автоматический режим",
        "article_prefix": "Я5000-1Ф-",
        "description_suffix": "без переключателя на автоматический режим"
    },
    {
        "code": "single_no_auto_with_contacts",
        "name": "Однофидерный, без переключателя на автоматический режим, с контактами состояния на авт. выключателе",
        "article_prefix": "Я5000-1Ф-К-",
        "description_suffix": "без переключателя на автоматический режим, с контактами состояния"
    },
    {
        "code": "single_with_auto",
        "name": "Однофидерный, с переключателем на автоматический режим",
        "article_prefix": "Я5000-1Ф-А-",
        "description_suffix": "с переключателем на автоматический режим"
    }
]

products = []
product_id = 1331

for brand in brands:
    for current in currents:
        for feeder_type in feeder_types:
            # Определяем размеры
            if current <= 25:
                width = "310"
                height = "395"
            else:
                width = "400"
                height = "500"
            
            # Определяем цену (примерная)
            if current <= 16:
                base_price = 10000
            elif current <= 25:
                base_price = 12000
            elif current <= 50:
                base_price = 15000
            else:
                base_price = 20000
            
            # Формируем артикул
            article = f"{feeder_type['article_prefix']}{current}-РОСЭК"
            
            product = {
                "id": product_id,
                "article": article,
                "nominal_current": current,
                "brand": brand,
                "commutation_type": "motor_control_box",
                "box_type": "single_feeder",
                "motor_control_type": "non_reversible",
                "feeder_type": feeder_type["code"],
                "base_price": base_price,
                "main_image": "images/upr-ilektr.png",
                "images": ["images/upr-ilektr.png"],
                "description": f"Ящик управления Я5000 на базе {brand} однофидерный нереверсивный {current}А {feeder_type['description_suffix']}",
                "full_description": f"Ящик управления электродвигателем Я5000 однофидерный нереверсивный, номинальный ток {current}А, {feeder_type['description_suffix']}.",
                "documentation": [
                    {
                        "url": "../documents/Сертификат НКУ (ТР ТС) 2024-2029.pdf",
                        "name": "Сертификат НКУ (ТР ТС) 2024-2029",
                        "size": 1251760
                    }
                ],
                "specs": {
                    "Артикул": article,
                    "Производитель": brand,
                    "Номинальный ток щитка, А": str(current),
                    "Тип": "Однофидерный нереверсивный",
                    "Количество фидеров": feeder_type["name"],
                    "Ширина, мм": width,
                    "Высота, мм": height
                }
            }
            
            products.append(product)
            product_id += 1

# Сохраняем в JSON
with open('single_feeder_boxes_full.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=20)

print(f"Создано {len(products)} однофидерных ящиков")
print(f"ID с {1331} по {product_id-1}")
