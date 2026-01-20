<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Получаем параметры
$switching_type = $_GET['switching_type'] ?? '';
$inputs = $_GET['inputs'] ?? '';
$current = $_GET['current'] ?? '';
$manufacturer = $_GET['manufacturer'] ?? '';

// Загружаем конфигурацию документов
$documents_config = json_decode(file_get_contents('../data/documents.json'), true);

$response = [
    'success' => false,
    'documents' => [],
    'message' => ''
];

try {
    // Проверяем наличие документов для указанных параметров
    if (isset($documents_config['documents'][$switching_type])) {
        $switching_config = $documents_config['documents'][$switching_type];
        
        if (isset($switching_config['inputs'][$inputs])) {
            $inputs_config = $switching_config['inputs'][$inputs];
            
            // Находим подходящий диапазон токов
            $current_range_key = null;
            foreach ($inputs_config['current_ranges'] as $range_key => $range_config) {
                $range_parts = explode('-', $range_key);
                if (count($range_parts) === 2) {
                    $min_current = intval($range_parts[0]);
                    $max_current = intval($range_parts[1]);
                    $current_value = intval($current);
                    
                    if ($current_value >= $min_current && $current_value <= $max_current) {
                        $current_range_key = $range_key;
                        break;
                    }
                }
            }
            
            if ($current_range_key && isset($inputs_config['current_ranges'][$current_range_key])) {
                $range_config = $inputs_config['current_ranges'][$current_range_key];
                
                // Проверяем ограничения по производителю
                $manufacturer_allowed = true;
                if (isset($range_config['manufacturers']['exclude']) && 
                    in_array($manufacturer, $range_config['manufacturers']['exclude'])) {
                    $manufacturer_allowed = false;
                }
                
                if ($manufacturer_allowed && isset($range_config['path'])) {
                    $docs_path = '../' . $range_config['path'];
                    
                    if (is_dir($docs_path)) {
                        $files = scandir($docs_path);
                        $pdf_files = [];
                        
                        foreach ($files as $file) {
                            if (pathinfo($file, PATHINFO_EXTENSION) === 'pdf') {
                                // Фильтруем документы по конкретному току
                                $current_value = intval($current);
                                $file_lower = mb_strtolower($file, 'UTF-8');
                                
                                // Ищем ток в названии файла (например "25А", "100А")
                                if (preg_match('/(\d+)а/ui', $file_lower, $matches)) {
                                    $file_current = intval($matches[1]);
                                    
                                    // Показываем только документы для выбранного тока
                                    if ($file_current === $current_value) {
                                        $pdf_files[] = [
                                            'name' => pathinfo($file, PATHINFO_FILENAME),
                                            'filename' => $file,
                                            'url' => str_replace('../', '', $docs_path) . '/' . $file,
                                            'size' => filesize($docs_path . '/' . $file),
                                            'current' => $file_current
                                        ];
                                    }
                                } else {
                                    // Если в названии нет тока, показываем для всех токов
                                    $pdf_files[] = [
                                        'name' => pathinfo($file, PATHINFO_FILENAME),
                                        'filename' => $file,
                                        'url' => str_replace('../', '', $docs_path) . '/' . $file,
                                        'size' => filesize($docs_path . '/' . $file),
                                        'current' => null
                                    ];
                                }
                            }
                        }
                        
                        $response['success'] = true;
                        $response['documents'] = $pdf_files;
                        $response['message'] = count($pdf_files) > 0 ? 
                            'Найдено документов для тока ' . $current . 'А: ' . count($pdf_files) : 
                            'Документы для тока ' . $current . 'А пока не загружены';
                    } else {
                        $response['message'] = 'Папка с документами не найдена';
                    }
                } else {
                    $response['message'] = 'Документация для производителя ' . $manufacturer . ' недоступна';
                }
            } else {
                $response['message'] = 'Документы для тока ' . $current . 'А не найдены';
            }
        } else {
            $response['message'] = 'Документы для ' . $inputs . ' вводов не найдены';
        }
    } else {
        $response['message'] = 'Документы для типа коммутации "' . $switching_type . '" не найдены';
    }
    
} catch (Exception $e) {
    $response['message'] = 'Ошибка при загрузке документов: ' . $e->getMessage();
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>