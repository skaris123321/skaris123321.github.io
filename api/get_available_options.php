<?php
/**
 * API для получения доступных опций товаров
 * Возвращает список доступных значений для каждого параметра
 */

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

    // Получаем параметры запроса для фильтрации
    $nominalCurrent = isset($_GET['nominal_current']) ? (int)$_GET['nominal_current'] : null;
    $commutationType = $_GET['commutation_type'] ?? null;
    $manufacturerBrand = $_GET['manufacturer_brand'] ?? null;
    $inputsCount = $_GET['inputs_count'] ?? null;

    // Фильтруем продукты по заданным параметрам
    $filteredProducts = $data['products'];
    
    if ($nominalCurrent) {
        $filteredProducts = array_filter($filteredProducts, function($p) use ($nominalCurrent) {
            return isset($p['nominal_current']) && (int)$p['nominal_current'] === $nominalCurrent;
        });
    }
    
    if ($commutationType) {
        $filteredProducts = array_filter($filteredProducts, function($p) use ($commutationType) {
            return isset($p['commutation_type']) && $p['commutation_type'] === $commutationType;
        });
    }
    
    if ($manufacturerBrand) {
        $filteredProducts = array_filter($filteredProducts, function($p) use ($manufacturerBrand) {
            return isset($p['brand']) && $p['brand'] === $manufacturerBrand;
        });
    }
    
    if ($inputsCount) {
        $filteredProducts = array_filter($filteredProducts, function($p) use ($inputsCount) {
            return isset($p['inputs_count']) && $p['inputs_count'] === $inputsCount;
        });
    }

    // Получаем уникальные значения для каждого параметра
    // При получении опций исключаем фильтр по самому параметру
    $availableOptions = [
        'nominal_current' => [],
        'commutation_type' => [],
        'manufacturer_brand' => [],
        'inputs_count' => []
    ];

    // Бренд производителя (все доступные бренды из базы)
    $allBrands = [];
    foreach ($data['products'] as $product) {
        if (isset($product['brand']) && !in_array($product['brand'], $allBrands)) {
            $allBrands[] = $product['brand'];
        }
    }
    sort($allBrands);
    $availableOptions['manufacturer_brand'] = $allBrands;

    // Тип коммутации (фильтруем по бренду, если выбран)
    $typeProducts = $data['products'];
    if ($manufacturerBrand) {
        $typeProducts = array_filter($typeProducts, function($p) use ($manufacturerBrand) {
            return isset($p['brand']) && $p['brand'] === $manufacturerBrand;
        });
    }
    $commutationTypes = [];
    foreach ($typeProducts as $product) {
        if (isset($product['commutation_type']) && !in_array($product['commutation_type'], $commutationTypes)) {
            $commutationTypes[] = $product['commutation_type'];
        }
    }
    sort($commutationTypes);
    $availableOptions['commutation_type'] = $commutationTypes;

    // Количество вводов (фильтруем по бренду и типу коммутации)
    $inputsProducts = $data['products'];
    if ($manufacturerBrand) {
        $inputsProducts = array_filter($inputsProducts, function($p) use ($manufacturerBrand) {
            return isset($p['brand']) && $p['brand'] === $manufacturerBrand;
        });
    }
    if ($commutationType) {
        $inputsProducts = array_filter($inputsProducts, function($p) use ($commutationType) {
            return isset($p['commutation_type']) && $p['commutation_type'] === $commutationType;
        });
    }
    $inputsCounts = [];
    foreach ($inputsProducts as $product) {
        if (isset($product['inputs_count']) && !in_array($product['inputs_count'], $inputsCounts)) {
            $inputsCounts[] = $product['inputs_count'];
        }
    }
    sort($inputsCounts, SORT_STRING);
    $availableOptions['inputs_count'] = $inputsCounts;

    // Номинальный ток (фильтруем по бренду, типу коммутации и количеству вводов)
    $currentProducts = $data['products'];
    if ($manufacturerBrand) {
        $currentProducts = array_filter($currentProducts, function($p) use ($manufacturerBrand) {
            return isset($p['brand']) && $p['brand'] === $manufacturerBrand;
        });
    }
    if ($commutationType) {
        $currentProducts = array_filter($currentProducts, function($p) use ($commutationType) {
            return isset($p['commutation_type']) && $p['commutation_type'] === $commutationType;
        });
    }
    if ($inputsCount) {
        $currentProducts = array_filter($currentProducts, function($p) use ($inputsCount) {
            return isset($p['inputs_count']) && $p['inputs_count'] === $inputsCount;
        });
    }
    $nominalCurrents = [];
    foreach ($currentProducts as $product) {
        if (isset($product['nominal_current']) && !in_array($product['nominal_current'], $nominalCurrents)) {
            $nominalCurrents[] = (int)$product['nominal_current'];
        }
    }
    sort($nominalCurrents, SORT_NUMERIC);
    $availableOptions['nominal_current'] = $nominalCurrents;

    echo json_encode([
        'success' => true,
        'available_options' => $availableOptions
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
