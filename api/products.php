<?php
require_once 'db.php';

$category = $_GET['category'] ?? '';
$brand    = $_GET['brand'] ?? '';
$search   = $_GET['search'] ?? '';
$limit    = min((int)($_GET['limit'] ?? 100), 500);
$offset   = max((int)($_GET['offset'] ?? 0), 0);

if (empty($category)) {
    http_response_code(400);
    echo json_encode(['error' => 'Параметр category обязателен']);
    exit;
}

try {
    $db = getDB();

    // Базовый запрос
    $sql = "SELECT p.* FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE c.slug = :category AND p.is_active = 1";
    $params = [':category' => $category];

    if (!empty($brand)) {
        $sql .= " AND p.brand = :brand";
        $params[':brand'] = $brand;
    }

    if (!empty($search)) {
        $sql .= " AND (p.name LIKE :search OR p.article LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }

    $sql .= " ORDER BY p.sort_order ASC, p.id ASC LIMIT :limit OFFSET :offset";

    $stmt = $db->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $products = $stmt->fetchAll();

    // Декодируем JSON-поля
    foreach ($products as &$p) {
        $p['images']    = $p['images']    ? json_decode($p['images'], true)    : [];
        $p['specs']     = $p['specs']     ? json_decode($p['specs'], true)     : [];
        $p['options']   = $p['options']   ? json_decode($p['options'], true)   : [];
        $p['documents'] = $p['documents'] ? json_decode($p['documents'], true) : [];
    }

    // Считаем общее количество для пагинации
    $countSql = "SELECT COUNT(*) FROM products p
                 JOIN categories c ON p.category_id = c.id
                 WHERE c.slug = :category AND p.is_active = 1";
    $countParams = [':category' => $category];
    if (!empty($brand)) {
        $countSql .= " AND p.brand = :brand";
        $countParams[':brand'] = $brand;
    }
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($countParams);
    $total = (int)$countStmt->fetchColumn();

    echo json_encode([
        'products' => $products,
        'total'    => $total,
        'limit'    => $limit,
        'offset'   => $offset,
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка сервера']);
}
