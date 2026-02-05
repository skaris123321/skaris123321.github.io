import json
import codecs

# Читаем файл с правильной кодировкой
with codecs.open('data/products.json', 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Исходный размер файла: {len(content)} символов")

# Подсчитываем количество замен
count_before = content.count('ШУ-ЧР-')
print(f"Найдено артикулов с ШУ-ЧР-: {count_before}")

# Заменяем все вхождения
content = content.replace('ШУ-ЧР-', 'ШУ-ПП-')

# Проверяем результат
count_after = content.count('ШУ-ЧР-')
count_fixed = content.count('ШУ-ПП-')
print(f"После замены осталось ШУ-ЧР-: {count_after}")
print(f"Стало ШУ-ПП-: {count_fixed}")

# Сохраняем файл
with codecs.open('data/products.json', 'w', encoding='utf-8') as f:
    f.write(content)

print("Файл сохранен")