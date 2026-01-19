<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Обработка preflight запроса
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$jsonPath = __DIR__ . '/../data/products.json';

try {
    // Проверяем наличие файла с данными
    if (!file_exists($jsonPath)) {
        throw new Exception('Файл с товарами не найден: data/products.json');
    }

    // Читаем и парсим JSON
    $raw = file_get_contents($jsonPath);
    $data = json_decode($raw, true);

    if (!is_array($data) || !isset($data['products']) || !is_array($data['products'])) {
        throw new Exception('Некорректный формат файла products.json');
    }

    // Параметры запроса
    $nominalCurrent = isset($_GET['nominal_current']) ? (int)$_GET['nominal_current'] : null;

    if (!$nominalCurrent) {
        throw new Exception('Параметр nominal_current обязателен');
    }

    $commutationType    = $_GET['commutation_type']    ?? null;
    $brandFilter        = $_GET['manufacturer_brand']  ?? null; // в JSON поле называется brand
    $inputsCount        = $_GET['inputs_count']        ?? null; // в JSON: "2" или "3"

    // Ищем первый подходящий товар в JSON
    $foundProduct = null;
    foreach ($data['products'] as $product) {
        if (!isset($product['nominal_current'])) continue;

        if ((int)$product['nominal_current'] !== $nominalCurrent) {
            continue;
        }

        if ($commutationType && (!isset($product['commutation_type']) || $product['commutation_type'] !== $commutationType)) {
            continue;
        }

        if ($brandFilter && (!isset($product['brand']) || $product['brand'] !== $brandFilter)) {
            continue;
        }

        if ($inputsCount && (!isset($product['inputs_count']) || $product['inputs_count'] !== $inputsCount)) {
            continue;
        }

        $foundProduct = $product;
        break;
    }

    if (!$foundProduct) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Товар не найден'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Извлекаем данные
    $images        = isset($foundProduct['images']) && is_array($foundProduct['images'])
        ? $foundProduct['images']
        : (isset($foundProduct['main_image']) ? [$foundProduct['main_image']] : []);

    $documentation = isset($foundProduct['documentation']) && is_array($foundProduct['documentation'])
        ? $foundProduct['documentation']
        : [];

    $specs = isset($foundProduct['specs']) && is_array($foundProduct['specs'])
        ? $foundProduct['specs']
        : [];

    // Формируем ответ
    $response = [
        'success' => true,
        'product' => [
            'id'                => isset($foundProduct['id']) ? (int)$foundProduct['id'] : null,
            'article'           => $foundProduct['article'] ?? '',
            'nominal_current'   => (int)$foundProduct['nominal_current'],
            'commutation_type'  => $foundProduct['commutation_type'] ?? null,
            'monoblock_series'  => null, // серия моноблока больше не используется
            'manufacturer_brand'=> $foundProduct['brand'] ?? null,
            'inputs_count'      => $foundProduct['inputs_count'] ?? null,
            'product_function'  => null, // функция больше не используется
            'base_price'        => (int)($foundProduct['base_price'] ?? 0),
            'main_image'        => $foundProduct['main_image'] ?? (isset($images[0]) ? $images[0] : null),
            'images' => $images,
            'description'       => $foundProduct['description'] ?? '',
            'full_description'  => $foundProduct['full_description'] ?? ($foundProduct['description'] ?? ''),
            'dimensions'        => null,
            'documentation' => $documentation,
            'specs' => $specs
        ]
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка базы данных: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
