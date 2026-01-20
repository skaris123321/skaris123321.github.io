// Функции для работы с документацией

class DocumentsManager {
    constructor() {
        this.documentsContainer = null;
        this.currentDocuments = [];
    }

    // Инициализация менеджера документов
    init() {
        // Ждем загрузки Alpine.js и создания продукта
        document.addEventListener('alpine:initialized', () => {
            this.createDocumentsSection();
        });
    }

    // Создание секции для документов
    createDocumentsSection() {
        // Ищем контейнер для характеристик продукта
        const productSpecsColumn = document.querySelector('.product-specs-column');
        if (!productSpecsColumn) return;

        // Создаем контейнер для документов
        const documentsSection = document.createElement('div');
        documentsSection.className = 'documents-section';
        documentsSection.innerHTML = `
            <h3>Техническая документация</h3>
            <div class="documents-container" id="documents-container">
                <div class="documents-loading" style="display: none;">
                    <p>Загрузка документов...</p>
                </div>
                <div class="documents-list" id="documents-list"></div>
                <div class="documents-message" id="documents-message"></div>
            </div>
        `;

        // Добавляем секцию в конец колонки характеристик
        productSpecsColumn.appendChild(documentsSection);

        this.documentsContainer = document.getElementById('documents-container');
    }

    // Загрузка документов для текущего продукта
    async loadDocuments(productData) {
        if (!this.documentsContainer) return;

        const loadingElement = this.documentsContainer.querySelector('.documents-loading');
        const listElement = this.documentsContainer.querySelector('.documents-list');
        const messageElement = this.documentsContainer.querySelector('.documents-message');

        // Показываем индикатор загрузки
        loadingElement.style.display = 'block';
        listElement.innerHTML = '';
        messageElement.innerHTML = '';

        try {
            // Определяем параметры для поиска документов
            const params = this.getDocumentParams(productData);
            
            if (!params) {
                this.showMessage('Документы для данного типа продукта пока недоступны');
                return;
            }

            // Запрашиваем документы с сервера
            const response = await fetch(`api/get_documents.php?${new URLSearchParams(params)}`);
            const data = await response.json();

            loadingElement.style.display = 'none';

            if (data.success && data.documents.length > 0) {
                this.displayDocuments(data.documents);
            } else {
                this.showMessage(data.message || 'Документы не найдены');
            }

        } catch (error) {
            loadingElement.style.display = 'none';
            this.showMessage('Ошибка при загрузке документов');
            console.error('Ошибка загрузки документов:', error);
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

    // Отображение списка документов
    displayDocuments(documents) {
        const listElement = this.documentsContainer.querySelector('.documents-list');
        
        if (documents.length === 0) {
            listElement.innerHTML = '';
            return;
        }
        
        listElement.innerHTML = documents.map(doc => `
            <div class="document-item">
                <div class="document-info">
                    <h4 class="document-name">${doc.name}</h4>
                    <div class="document-details">
                        <span class="document-size">${this.formatFileSize(doc.size)}</span>
                        ${doc.current ? `<span class="document-current">Для тока: ${doc.current}А</span>` : ''}
                    </div>
                </div>
                <div class="document-actions">
                    <a href="${doc.url}" target="_blank" class="btn btn-primary btn-sm">
                        <i class="icon-download"></i> Скачать PDF
                    </a>
                    <button onclick="documentsManager.previewDocument('${doc.url}')" class="btn btn-secondary btn-sm">
                        <i class="icon-eye"></i> Просмотр
                    </button>
                </div>
            </div>
        `).join('');

        this.currentDocuments = documents;
    }

    // Показ сообщения
    showMessage(message) {
        const messageElement = this.documentsContainer.querySelector('.documents-message');
        messageElement.innerHTML = `<p class="documents-info">${message}</p>`;
    }

    // Форматирование размера файла
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Предварительный просмотр документа
    previewDocument(url) {
        // Создаем модальное окно для просмотра PDF
        const modal = document.createElement('div');
        modal.className = 'document-modal';
        modal.innerHTML = `
            <div class="document-modal-content">
                <div class="document-modal-header">
                    <h3>Просмотр документа</h3>
                    <button class="document-modal-close" onclick="this.closest('.document-modal').remove()">×</button>
                </div>
                <div class="document-modal-body">
                    <iframe src="${url}" width="100%" height="600px" frameborder="0"></iframe>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Закрытие по клику вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

// Создаем глобальный экземпляр менеджера документов
const documentsManager = new DocumentsManager();

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    documentsManager.init();
});