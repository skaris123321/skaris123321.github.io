-- База данных РОСЭК
-- Запустить один раз на хостинге через phpMyAdmin или командную строку

CREATE DATABASE IF NOT EXISTS rosek CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rosek;

-- Категории товаров
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,  -- avr, control-cabinets, motor-control-boxes, reactive-power
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (slug, name) VALUES
('avr', 'Автоматический ввод резерва'),
('control-cabinets', 'Шкафы управления'),
('motor-control-boxes', 'Ящики управления двигателями'),
('reactive-power', 'Компенсация реактивной мощности');

-- Товары
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    article VARCHAR(100),
    name VARCHAR(500) NOT NULL,
    brand VARCHAR(100),
    price DECIMAL(12,2) DEFAULT 0,
    price_unit VARCHAR(50) DEFAULT 'шт',
    description TEXT,
    delivery VARCHAR(255),
    images JSON,           -- массив путей к изображениям
    specs JSON,            -- характеристики товара
    options JSON,          -- варианты (токи, вводы и т.д.)
    documents JSON,        -- ссылки на документы
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_article ON products(article);

-- Заказы
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    customer_company VARCHAR(255),
    comment TEXT,
    items JSON NOT NULL,   -- список товаров в заказе
    total DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'new',  -- new, processing, done, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
