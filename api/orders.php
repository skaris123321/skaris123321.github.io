<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

// Получаем данные заказа
$orderData = json_decode(file_get_contents('php://input'), true);

if (!$orderData) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit;
}

// Логируем получение заказа
error_log("Получен новый заказ: " . $orderData['clientType'] . ", товаров: " . $orderData['totalItems']);

// Сохраняем заказ в файл (резервная копия)
$ordersDir = __DIR__ . '/../orders';
if (!file_exists($ordersDir)) {
    mkdir($ordersDir, 0755, true);
}

$timestamp = date('Y-m-d_H-i-s');
$filename = "order-{$timestamp}.json";
$filepath = $ordersDir . '/' . $filename;

file_put_contents($filepath, json_encode($orderData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
error_log("Заказ сохранен: {$filename}");

// Отправляем заказ в 1С
$onecResult = null;
if (!empty($config['ONEC_API_URL']) && !empty($config['ONEC_USERNAME'])) {
    error_log("Отправка заказа в 1С...");
    $onecResult = sendOrderTo1C($orderData, $config);
    
    if ($onecResult['success']) {
        error_log("Заказ успешно создан в 1С: " . ($onecResult['orderId'] ?? 'ID не получен'));
    } else {
        error_log("Ошибка отправки в 1С: " . $onecResult['error']);
    }
} else {
    error_log("Интеграция с 1С не настроена. Заказ сохранен только в файл.");
}

// Отправляем ответ
echo json_encode([
    'success' => true,
    'message' => 'Заказ успешно оформлен',
    'orderId' => str_replace('.json', '', $filename),
    'onecOrderId' => $onecResult['success'] ?? false ? ($onecResult['orderId'] ?? null) : null,
    'sentTo1C' => $onecResult['success'] ?? false
], JSON_UNESCAPED_UNICODE);

// Функция отправки заказа в 1С
function sendOrderTo1C($orderData, $config) {
    $maxAttempts = intval($config['ONEC_RETRY_ATTEMPTS'] ?? 3);
    
    // Формируем данные для 1С
    $onecData = [
        'orderDate' => $orderData['orderDate'],
        'clientType' => $orderData['clientType'],
        'clientInfo' => [
            'fullName' => $orderData['fullName'] ?? '',
            'companyName' => $orderData['companyName'] ?? '',
            'inn' => $orderData['inn'] ?? '',
            'kpp' => $orderData['kpp'] ?? '',
            'legalAddress' => $orderData['legalAddress'] ?? '',
            'contactPerson' => $orderData['contactPerson'] ?? '',
            'phone' => $orderData['phone'],
            'email' => $orderData['email'],
            'address' => $orderData['address'] ?? ''
        ],
        'items' => array_map(function($item) {
            return [
                'article' => $item['article'],
                'productTitle' => $item['productTitle'],
                'manufacturerBrand' => $item['manufacturerBrand'],
                'quantity' => $item['quantity'],
                'price' => $item['totalPrice'],
                'totalPrice' => $item['totalPrice'] * $item['quantity']
            ];
        }, $orderData['items']),
        'totalItems' => $orderData['totalItems'],
        'totalPrice' => $orderData['totalPrice'],
        'comment' => $orderData['comment'] ?? ''
    ];
    
    // Попытки отправки с retry логикой
    for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
        error_log("Попытка {$attempt}/{$maxAttempts}: Отправка заказа в 1С");
        
        $ch = curl_init($config['ONEC_API_URL']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($onecData, JSON_UNESCAPED_UNICODE));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Basic ' . base64_encode($config['ONEC_USERNAME'] . ':' . $config['ONEC_PASSWORD'])
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            error_log("Попытка {$attempt}/{$maxAttempts} не удалась: {$error}");
            
            if ($attempt === $maxAttempts) {
                return [
                    'success' => false,
                    'error' => $error,
                    'message' => "Не удалось отправить заказ в 1С после {$maxAttempts} попыток"
                ];
            }
            
            // Экспоненциальная задержка
            $delay = pow(2, $attempt - 1);
            error_log("Повтор через {$delay} секунд...");
            sleep($delay);
            continue;
        }
        
        $result = json_decode($response, true);
        
        if ($httpCode === 200 && isset($result['success']) && $result['success']) {
            return [
                'success' => true,
                'orderId' => $result['orderId'] ?? null,
                'message' => 'Заказ успешно создан в 1С'
            ];
        }
        
        error_log("Попытка {$attempt}/{$maxAttempts} не удалась: HTTP {$httpCode}");
        
        if ($attempt < $maxAttempts) {
            $delay = pow(2, $attempt - 1);
            sleep($delay);
        }
    }
    
    return [
        'success' => false,
        'error' => 'HTTP ' . $httpCode,
        'message' => "Не удалось отправить заказ в 1С после {$maxAttempts} попыток"
    ];
}
