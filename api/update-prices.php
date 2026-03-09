<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Загружаем конфигурацию
$config = parse_ini_file(__DIR__ . '/../config.ini');

// Проверка токена авторизации
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$expectedToken = 'Bearer ' . ($config['API_TOKEN'] ?? 'default-token-change-me');

if ($authHeader !== $expectedToken) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Unauthorized: Invalid or missing API token'
    ]);
    exit;
}

// Получаем данные
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['prices']) || !is_array($data['prices'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Поле prices должно быть массивом'
    ]);
    exit;
}

$prices = $data['prices'];
error_log("Получен запрос на обновление цен: " . count($prices) . " товаров");

// Все файлы с товарами
$categoryFiles = [
    '../data/products-avr.json',
    '../data/products-control-cabinets.json',
    '../data/products-motor-control-boxes.json',
    '../data/products-reactive-power.json'
];

$updatedCount = 0;
$notFoundArticles = [];

// Обрабатываем каждый файл категории
foreach ($categoryFiles as $categoryFile) {
    $filePath = __DIR__ . '/' . $categoryFile;
    
    if (!file_exists($filePath)) {
        continue;
    }
    
    // Читаем файл
    $fileContent = file_get_contents($filePath);
    $data = json_decode($fileContent, true);
    
    if (!$data || !isset($data['products'])) {
        continue;
    }
    
    $fileUpdated = false;
    
    // Обновляем цены
    foreach ($data['products'] as &$product) {
        foreach ($prices as $priceUpdate) {
            if ($product['article'] === $priceUpdate['article']) {
                $oldPrice = $product['base_price'];
                $product['base_price'] = $priceUpdate['price'];
                
                if ($oldPrice !== $priceUpdate['price']) {
                    error_log("  {$product['article']}: {$oldPrice} → {$priceUpdate['price']} ₽");
                    $updatedCount++;
                    $fileUpdated = true;
                }
                break;
            }
        }
    }
    
    // Сохраняем файл только если были изменения
    if ($fileUpdated) {
        file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        error_log("  Сохранен файл: " . basename($categoryFile));
    }
}

// Проверяем, какие артикулы не найдены
foreach ($prices as $priceItem) {
    $found = false;
    
    foreach ($categoryFiles as $categoryFile) {
        $filePath = __DIR__ . '/' . $categoryFile;
        
        if (!file_exists($filePath)) {
            continue;
        }
        
        $fileContent = file_get_contents($filePath);
        $data = json_decode($fileContent, true);
        
        if ($data && isset($data['products'])) {
            foreach ($data['products'] as $product) {
                if ($product['article'] === $priceItem['article']) {
                    $found = true;
                    break 2;
                }
            }
        }
    }
    
    if (!$found) {
        $notFoundArticles[] = $priceItem['article'];
    }
}

error_log("Обновлено цен: {$updatedCount}");

if (count($notFoundArticles) > 0) {
    error_log("Не найдены артикулы: " . implode(', ', $notFoundArticles));
}

echo json_encode([
    'success' => true,
    'message' => 'Цены обновлены',
    'updated' => $updatedCount,
    'notFound' => $notFoundArticles
], JSON_UNESCAPED_UNICODE);
