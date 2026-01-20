// Функции для работы с документацией

class DocumentsManager {
    constructor() {
        this.currentDocuments = [];
    }

    // Инициализация менеджера документов
    init() {
        // Ждем загрузки Alpine.js
        document.addEventListener('alpine:initialized', () => {
            console.log('DocumentsManager инициализирован');
        });
    }

    // Загрузка документов для текущего продукта
    async loadDocuments(productData) {
        try {
            // Определяем параметры для поиска документов
            const params = this.getDocumentParams(productData);
            
            if (!params) {
                this.updateAlpineDocumentation([]);
                return;
            }

            // Запрашиваем документы с сервера
            const response = await fetch(`api/get_documents.php?${new URLSearchParams(params)}`);
            const data = await response.json();

            if (data.success && data.documents.length > 0) {
                // Преобразуем документы в формат для Alpine.js
                const alpineDocuments = data.documents.map(doc => ({
                    name: doc.name,
                    url: doc.url,
                    size: doc.size,
                    current: doc.current
                }));
                
                this.updateAlpineDocumentation(alpineDocuments);
                console.log('Документы загружены:', alpineDocuments);
            } else {
                this.updateAlpineDocumentation([]);
                console.log('Документы не найдены:', data.message);
            }

        } catch (error) {
            this.updateAlpineDocumentation([]);
            console.error('Ошибка при загрузке документов:', error);
        }
    }

    // Обновление документов в Alpine.js
    updateAlpineDocumentation(documents) {
        // Находим Alpine компонент и обновляем документы
        const productElement = document.querySelector('[x-data*="productData"]');
        if (productElement && productElement._x_dataStack) {
            const alpineData = productElement._x_dataStack[0];
            if (alpineData) {
                alpineData.documentation = documents;
                // Принудительно обновляем Alpine
                if (window.Alpine) {
                    window.Alpine.nextTick(() => {
                        console.log('Alpine документы обновлены:', documents);
                    });
                }
            }
        }
    }

    // Определение параметров для поиска документов
    getDocumentParams(productData) {
        // Проверяем, что это АВР
        if (!productData.name || !productData.name.toLowerCase().includes('авр')) {
            return null;
        }

        // Определяем тип коммутации
        let switching_type = null;
        if (productData.commutation_type === 'monoblock' || 
            productData.name.toLowerCase().includes('моноблочный')) {
            switching_type = 'monoblock-avr';
        }

        if (!switching_type) return null;

        // Определяем количество вводов
        let inputs = null;
        if (productData.inputs === 2 || productData.name.includes('2 ввода')) {
            inputs = '2';
        }

        if (!inputs) return null;

        // Определяем ток
        let current = null;
        if (productData.current) {
            current = productData.current.toString();
        } else {
            // Пытаемся извлечь из названия
            const currentMatch = productData.name.match(/(\d+)А/);
            if (currentMatch) {
                current = currentMatch[1];
            }
        }

        if (!current) return null;

        // Определяем производителя
        let manufacturer = productData.manufacturer || '';

        return {
            switching_type,
            inputs,
            current,
            manufacturer
        };
    }
}

// Создаем глобальный экземпляр менеджера документов
const documentsManager = new DocumentsManager();

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    documentsManager.init();
});