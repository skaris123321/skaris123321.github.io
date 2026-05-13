<?php
/**
 * API для оформления заказа
 * 
 * ⚠️ ПРИМЕЧАНИЕ: Интеграция с 1С оставлена как показательная
 * На данный момент сайт передан компании ООО «РОСЭК» в качестве демонстрационной версии.
 * В перспективе предусмотрена интеграция с 1С для автоматической передачи заказов.
 */

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

// Получаем данные заказа
$orderData = json_decode(file_get_contents('php://input'), true);

if (!$orderData) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit;
}

// Логируем получение заказа
error_log("Получен новый заказ: " . $orderData['clientType'] . ", товаров: " . $orderData['totalItems']);

// Сохраняем заказ в файл
$ordersDir = __DIR__ . '/../orders';
if (!file_exists($ordersDir)) {
    mkdir($ordersDir, 0755, true);
}

$timestamp = date('Y-m-d_H-i-s');
$filename = "order-{$timestamp}.json";
$filepath = $ordersDir . '/' . $filename;

file_put_contents($filepath, json_encode($orderData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
error_log("Заказ сохранен: {$filename}");

// ⚠️ ИНТЕГРАЦИЯ С 1С (показательная)
// В реальной версии здесь была бы отправка заказа в 1С через API
// Код оставлен как демонстрация возможной реализации
/*
if (!empty($config['ONEC_API_URL'])) {
    $onecResult = sendOrderTo1C($orderData, $config);
    if ($onecResult['success']) {
        error_log("Заказ успешно создан в 1С: " . $onecResult['orderId']);
    }
}
*/

// Возвращаем успешный ответ
echo json_encode([
    'success' => true,
    'message' => 'Заказ успешно оформлен',
    'orderId' => str_replace('.json', '', $filename)
], JSON_UNESCAPED_UNICODE);

