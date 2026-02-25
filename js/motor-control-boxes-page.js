function motorControlBoxesPage() {
    return {
        products: [],
        filteredProducts: [],
        loading: true,
        selectedBoxType: '',
        selectedBrand: '',
        selectedCurrent: '',
        sortBy: '',
        availableBrands: [],
        availableCurrents: [],

        async init() {
            // Получаем параметры из URL
            const urlParams = new URLSearchParams(window.location.search);
            this.selectedBoxType = urlParams.get('boxType') || '';
            this.selectedBrand = urlParams.get('brand') || '';
            this.selectedCurrent = urlParams.get('current') || '';

            await this.loadProducts();
        },

        async loadProducts() {
            try {
                console.log('Загружаем ящики управления Я5000...');
                const response = await fetch('../data/products.json');
                
                if (!response.ok) throw new Error('Failed to load products');
                
                const data = await response.json();
                
                // Фильтруем только ящики управления Я5000
                this.products = data.products.filter(p => 
                    p.commutation_type === 'motor_control_box'
                );

                console.log('Загружено ящиков управления:', this.products.length);

                // Собираем уникальные бренды
                this.availableBrands = [...new Set(this.products.map(p => p.brand))].sort();

                // Собираем уникальные токи
                this.availableCurrents = [...new Set(this.products.map(p => p.nominal_current))].sort((a, b) => a - b);

                this.filterProducts();
                this.loading = false;
            } catch (error) {
                console.error('Ошибка загрузки ящиков управления:', error);
                this.loading = false;
            }
        },

        filterProducts() {
            this.filteredProducts = this.products.filter(product => {
                // Фильтр по типу ящика
                if (this.selectedBoxType && product.box_type !== this.selectedBoxType) {
                    return false;
                }

                // Фильтр по бренду
                if (this.selectedBrand && product.brand !== this.selectedBrand) {
                    return false;
                }

                // Фильтр по току
                if (this.selectedCurrent && product.nominal_current !== parseInt(this.selectedCurrent)) {
                    return false;
                }

                return true;
            });

            // Применяем сортировку
            if (this.sortBy === 'price_asc') {
                this.filteredProducts.sort((a, b) => a.base_price - b.base_price);
            } else if (this.sortBy === 'price_desc') {
                this.filteredProducts.sort((a, b) => b.base_price - a.base_price);
            }

            console.log('Отфильтровано товаров:', this.filteredProducts.length);
        },

        formatPrice(price) {
            return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
        }
    };
}
