function motorControlBoxesPage() {
    return {
        products: [],
        filteredProducts: [],
        loading: true,
        selectedBoxType: '',
        selectedBrand: '',
        selectedMotorControlType: '',
        selectedCurrent: null,
        selectedFeederType: '',
        sortBy: '',
        availableBrands: [],
        allCurrents: [0.6, 1.6, 2.5, 4, 6, 8, 10, 12, 16, 25, 32, 40, 50, 63, 80],
        allFeederTypes: [
            { code: 'single_no_auto', name: 'Без переключателя' },
            { code: 'single_no_auto_with_contacts', name: 'Без переключателя, с контактами' },
            { code: 'single_with_auto', name: 'С переключателем' }
        ],

        async init() {
            // Получаем параметры из URL
            const urlParams = new URLSearchParams(window.location.search);
            this.selectedBoxType = urlParams.get('boxType') || '';
            this.selectedBrand = urlParams.get('brand') || '';
            this.selectedMotorControlType = urlParams.get('motorControlType') || '';
            const currentParam = urlParams.get('current');
            this.selectedCurrent = currentParam ? parseFloat(currentParam) : null;
            this.selectedFeederType = urlParams.get('feederType') || '';

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

        // Проверка доступности типа управления
        isMotorControlTypeAvailable(motorControlType) {
            return this.products.some(product => {
                if (this.selectedBoxType && product.box_type !== this.selectedBoxType) return false;
                if (this.selectedBrand && product.brand !== this.selectedBrand) return false;
                if (this.selectedCurrent !== null && product.nominal_current !== this.selectedCurrent) return false;
                if (this.selectedFeederType && product.feeder_type !== this.selectedFeederType) return false;
                return product.motor_control_type === motorControlType;
            });
        },

        // Проверка доступности тока
        isCurrentAvailable(current) {
            return this.products.some(product => {
                if (this.selectedBoxType && product.box_type !== this.selectedBoxType) return false;
                if (this.selectedBrand && product.brand !== this.selectedBrand) return false;
                if (this.selectedMotorControlType && product.motor_control_type !== this.selectedMotorControlType) return false;
                if (this.selectedFeederType && product.feeder_type !== this.selectedFeederType) return false;
                return product.nominal_current === current;
            });
        },

        // Проверка доступности типа фидера
        isFeederTypeAvailable(feederType) {
            return this.products.some(product => {
                if (this.selectedBoxType && product.box_type !== this.selectedBoxType) return false;
                if (this.selectedBrand && product.brand !== this.selectedBrand) return false;
                if (this.selectedMotorControlType && product.motor_control_type !== this.selectedMotorControlType) return false;
                if (this.selectedCurrent !== null && product.nominal_current !== this.selectedCurrent) return false;
                return product.feeder_type === feederType;
            });
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

                // Фильтр по типу управления
                if (this.selectedMotorControlType && product.motor_control_type !== this.selectedMotorControlType) {
                    return false;
                }

                // Фильтр по току
                if (this.selectedCurrent !== null && product.nominal_current !== this.selectedCurrent) {
                    return false;
                }

                // Фильтр по типу фидера
                if (this.selectedFeederType && product.feeder_type !== this.selectedFeederType) {
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
            // Сбрасываем фильтры при смене типа ящика
            this.selectedMotorControlType = '';
            this.selectedCurrent = null;
            this.selectedFeederType = '';
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
