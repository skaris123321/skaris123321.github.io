function motorControlBoxesPage() {
    return {
        products: [],
        filteredProducts: [],
        loading: true,
        selectedBoxType: '',
        selectedBrand: '',
        sortBy: '',
        availableBrands: [],

        async init() {
            // Получаем параметры из URL
            const urlParams = new URLSearchParams(window.location.search);
            this.selectedBoxType = urlParams.get('boxType') || '';
            this.selectedBrand = urlParams.get('brand') || '';

            await this.loadProducts();
        },

        async loadProducts() {
            try {
                const response = await fetch('../data/products.json');
                
                if (!response.ok) throw new Error('Failed to load products');
                
                const data = await response.json();
                
                // Фильтруем только ящики управления Я5000
                this.products = data.products.filter(p => 
                    p.commutation_type === 'motor_control_box'
                );

                // Всегда показываем 3 разрешенных бренда для ящиков управления
                this.availableBrands = ['IEK', 'TDM', 'EKF'];

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

                return true;
            });

            // Применяем сортировку
            if (this.sortBy === 'price_asc') {
                this.filteredProducts.sort((a, b) => a.base_price - b.base_price);
            } else if (this.sortBy === 'price_desc') {
                this.filteredProducts.sort((a, b) => b.base_price - a.base_price);
            }
        },

        filterByBoxType(boxType) {
            this.selectedBoxType = this.selectedBoxType === boxType ? '' : boxType;
            this.filterProducts();
        },

        formatPrice(price) {
            return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
        },

        getProductUrl(product) {
            // Для ящиков управления передаем ID
            return `product.html?id=${product.id}`;
        }
    };
}
