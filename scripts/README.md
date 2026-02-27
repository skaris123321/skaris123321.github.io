# Скрипты генерации товаров

Эта папка содержит скрипты для генерации товаров ящиков управления Я5000.

## Файлы

- `check_stats.js` - проверка статистики товаров в базе данных
- `generate_single_feeder_boxes.js` - генерация однофидерных нереверсивных ящиков
- `generate_single_feeder_reversible_boxes.js` - генерация однофидерных реверсивных ящиков
- `generate_double_feeder_nonreversible_boxes.js` - генерация двухфидерных нереверсивных ящиков
- `generate_double_feeder_reversible_boxes.js` - генерация двухфидерных реверсивных ящиков
- `generate_triple_feeder_nonreversible_boxes.js` - генерация трехфидерных нереверсивных ящиков

## Использование

Запускать из корневой директории проекта:

```bash
node scripts/check_stats.js
node scripts/generate_single_feeder_boxes.js
# и т.д.
```

## Примечание

Эти скрипты используются только для первоначального создания или обновления товаров в базе данных.
После создания товаров они не нужны для работы сайта.
