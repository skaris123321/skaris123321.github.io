<?php
// Скрипт для одноразового импорта данных из JSON-файлов в MySQL
// Запустить один раз: https://ваш-сайт/api/import.php?key=rosek2026
// После импорта УДАЛИТЬ этот файл с сервера!

$secret = $_GET['key'] ?? '';
if ($secret !== 'rosek2026') {
    http_response_code(403);
    die('Доступ запрещён');
}

require_once 'db.php';

$files = [
    'avr'                => '../data/products-avr.json',
    'control-cabinets'   => '../data/products-control-cabinets.json',
    'motor-control-boxes'=> '../data/products-motor-control-boxes.json',
    'reactive-power'     => '../data/products-reactive-power.json',
];

$db = getDB();
$results = [];

foreach ($files as $slug => $file) {
    if (!file_exists($file)) {
        $results[] = "$slug: файл не найден";
        continue;
    }

    $data = json_decode(file_get_contents($file), true);
    if (!$data) {
        $results[] = "$slug: ошибка чтения JSON";
        continue;
    }

    // Получаем ID категории
    $stmt = $db->prepare("SELECT id FROM categories WHERE slug = ?");
    $stmt->execute([$slug]);
    $categoryId = $stmt->fetchColumn();

    if (!$categoryId) {
        $results[] = "$slug: категория не найдена в БД";
        continue;
    }

    $count = 0;
    $products = $data['products'] ?? $data;

    foreach ($products as $p) {
        $stmt = $db->prepare("INSERT INTO products
            (category_id, article, name, brand, price, price_unit, description, delivery, images, specs, options, documents, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $categoryId,
            $p['article'] ?? $p['id'] ?? null,
            $p['name'] ?? $p['title'] ?? '',
            $p['brand'] ?? null,
            $p['price'] ?? 0,
            $p['priceUnit'] ?? 'шт',
            $p['description'] ?? null,
            $p['delivery'] ?? null,
            json_encode($p['images'] ?? [], JSON_UNESCAPED_UNICODE),
            json_encode($p['specs'] ?? $p['characteristics'] ?? [], JSON_UNESCAPED_UNICODE),
            json_encode($p['options'] ?? [], JSON_UNESCAPED_UNICODE),
            json_encode($p['documents'] ?? [], JSON_UNESCAPED_UNICODE),
            $count,
        ]);
        $count++;
    }

    $results[] = "$slug: импортировано $count товаров";
}

echo "<pre>" . implode("\n", $results) . "\n\nГотово! Удалите этот файл с сервера.</pre>";
