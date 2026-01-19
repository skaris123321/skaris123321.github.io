<?php
/**
 * Скрипт инициализации базы данных SQLite
 * Запустите этот файл один раз для создания БД
 */

$dbPath = __DIR__ . '/../database/products.db';
$sqlPath = __DIR__ . '/../database/init.sql';

try {
    // Создаем директорию для БД, если её нет
    $dbDir = dirname($dbPath);
    if (!is_dir($dbDir)) {
        mkdir($dbDir, 0755, true);
    }

    // Подключаемся к БД (создаст файл, если его нет)
    $db = new PDO('sqlite:' . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Читаем SQL файл
    if (!file_exists($sqlPath)) {
        throw new Exception("SQL файл не найден: $sqlPath");
    }

    $sql = file_get_contents($sqlPath);
    
    // Выполняем SQL команды
    $db->exec($sql);
    
    echo "База данных успешно создана и инициализирована!\n";
    echo "Путь к БД: $dbPath\n";
    
} catch (PDOException $e) {
    echo "Ошибка БД: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Ошибка: " . $e->getMessage() . "\n";
}
?>
