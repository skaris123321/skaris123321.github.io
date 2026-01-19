<?php
/**
 * Тестовый файл для проверки работы API
 * Откройте в браузере: http://localhost/rosek-site/api/test.php
 */

echo "<h1>Тест API</h1>";

// Проверка PHP
echo "<h2>1. Проверка PHP</h2>";
echo "Версия PHP: " . phpversion() . "<br>";
echo "PDO SQLite доступен: " . (extension_loaded('pdo_sqlite') ? 'Да' : 'Нет') . "<br><br>";

// Проверка базы данных
echo "<h2>2. Проверка базы данных</h2>";
$dbPath = __DIR__ . '/../database/products.db';
if (file_exists($dbPath)) {
    echo "База данных найдена: " . $dbPath . "<br>";
    echo "Размер файла: " . filesize($dbPath) . " байт<br>";
    
    try {
        $db = new PDO('sqlite:' . $dbPath);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Проверяем количество товаров
        $stmt = $db->query("SELECT COUNT(*) as count FROM products");
        $result = $stmt->fetch();
        echo "Количество товаров в БД: " . $result['count'] . "<br><br>";
        
        // Показываем пример товара
        $stmt = $db->query("SELECT * FROM products LIMIT 1");
        $product = $stmt->fetch();
        if ($product) {
            echo "<h3>Пример товара:</h3>";
            echo "Артикул: " . htmlspecialchars($product['article']) . "<br>";
            echo "Номинальный ток: " . $product['nominal_current'] . "А<br>";
            echo "Цена: " . $product['base_price'] . " ₽<br>";
        }
    } catch (PDOException $e) {
        echo "Ошибка подключения к БД: " . $e->getMessage() . "<br>";
    }
} else {
    echo "База данных НЕ найдена!<br>";
    echo "Запустите <a href='init_db.php'>init_db.php</a> для создания БД.<br>";
}

echo "<br><h2>3. Тест API</h2>";
echo "<a href='get_product.php?nominal_current=100'>Тест: получить товар 100А</a><br>";
echo "<a href='get_product.php?nominal_current=250'>Тест: получить товар 250А</a><br>";
?>
