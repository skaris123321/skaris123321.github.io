# База данных товаров РОСЭК

## Структура

База данных разделена на отдельные файлы по категориям для удобства работы:

```
data/
├── products-index.json              # Индексный файл со списком всех категорий
├── products-avr.json                # АВР (моноблочные, контакторы, секционные)
├── products-control-cabinets.json   # Шкафы управления
├── products-reactive-power.json     # Компенсация реактивной мощности
├── products-motor-control-boxes.json # Ящики управления Я5000
└── products-backup.json             # Резервная копия старой базы
```

## Добавление товаров

### Способ 1: Через скрипт (рекомендуется)

1. Создайте JSON файл с новыми товарами (например, `new_boxes.json`):

```json
[
    {
        "article": "Я5111-1234",
        "nominal_current": 25,
        "brand": "РОСЭК",
        "commutation_type": "motor_control_box",
        "box_type": "single_feeder",
        "base_price": 15000,
        "description": "Ящик управления однофидерный 25А",
        "main_image": "images/box-single.jpg"
    }
]
```

2. Запустите скрипт:

```bash
node add_products_to_category.js motor-control-boxes new_boxes.json
```

Доступные категории:
- `avr` - АВР
- `control-cabinets` - Шкафы управления
- `reactive-power` - Компенсация реактивной мощности
- `motor-control-boxes` - Ящики управления

### Способ 2: Вручную

1. Откройте нужный файл категории (например, `products-motor-control-boxes.json`)
2. Добавьте товары в массив `products`
3. Обновите счетчик в `products-index.json`

## Обновление сайта

После добавления товаров запустите:

```bash
.\quick-update.bat
```

Это автоматически:
- Добавит изменения в Git
- Создаст коммит
- Отправит на GitHub
- Обновит сайт

## Структура товара

### Обязательные поля:

```json
{
    "id": 1234,                          // Уникальный ID (присваивается автоматически)
    "article": "АВР-2-25-М-РОСЭК",       // Артикул
    "nominal_current": 25,               // Номинальный ток
    "brand": "CHINT",                    // Бренд
    "commutation_type": "monoblock",     // Тип коммутации
    "base_price": 45000,                 // Базовая цена
    "description": "Краткое описание"    // Описание
}
```

### Дополнительные поля:

```json
{
    "main_image": "images/avr-100.jpg",  // Главное изображение
    "images": ["image1.jpg", "image2.jpg"], // Дополнительные изображения
    "full_description": "Полное описание", // Полное описание
    "specs": {                           // Характеристики
        "Габариты": "600х500х250 мм",
        "Номинальный ток": "25А"
    },
    "documentation": [                   // Документация
        {
            "name": "Чертеж",
            "url": "../documents/drawing.pdf",
            "size": 2048000,
            "type": "pdf"
        }
    ]
}
```

### Поля для разных категорий:

**АВР (avr):**
- `inputs_count`: "2" или "3" (количество вводов для моноблочных)
- `poles_count`: "single_phase" или "three_phase" (для контакторов)

**Шкафы управления (control-cabinets):**
- `control_type`: "soft_start", "frequency_converter", "direct_start"
- `motor_power`: мощность двигателя (кВт)
- `start_type`: тип пуска (для direct_start)
- `pump_count`: количество насосов

**Компенсация реактивной мощности (reactive-power):**
- `regulation_type`: "regulated" или "unregulated"
- `power`: мощность (кВАр)

**Ящики управления (motor-control-boxes):**
- `box_type`: "single_feeder", "double_feeder", "triple_feeder"
- `reversible`: true/false (для двухфидерных)
- `feeder_count`: количество фидеров

## API

Файл `js/products-api.js` автоматически загружает все категории и объединяет их.

Методы:
- `loadProducts()` - загружает все товары из всех категорий
- `loadCategory(categoryName)` - загружает только конкретную категорию (оптимизация)

## Резервное копирование

Перед изменениями создавайте резервную копию:

```bash
node split_products.js
```

Это пересоздаст все файлы категорий из `products.json`.
