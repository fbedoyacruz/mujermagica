CREATE TABLE IF NOT EXISTS app_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS providers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(140) NOT NULL,
    contact VARCHAR(120),
    phone VARCHAR(40),
    email VARCHAR(140),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(140) NOT NULL,
    document VARCHAR(60) NOT NULL UNIQUE,
    phone VARCHAR(40),
    email VARCHAR(140),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(160) NOT NULL,
    sku VARCHAR(80) NOT NULL UNIQUE,
    brand VARCHAR(120) NOT NULL,
    price_buy DECIMAL(12,2) NOT NULL DEFAULT 0,
    price_sell DECIMAL(12,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    provider_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
);

INSERT INTO app_users (username, password_hash, role, active)
VALUES ('admin', '$2a$10$Qb4n7ftmQx6f2Y8kA2vAluoJvN8mBkXhT/6N8MfrCF9M6N8Jb8VR2', 'ADMIN', TRUE)
ON DUPLICATE KEY UPDATE username = username;

INSERT INTO providers (name, contact, phone, email, active)
VALUES
('Beauty Imports SA', 'Carlos Mendoza', '601-234-5678', 'ventas@beautyimports.co', TRUE),
('Cosmeticos Premium', 'Lucia Gomez', '601-987-6543', 'pedidos@cosmeticospremium.co', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO customers (name, document, phone, email, active)
VALUES
('Mariana Gil', '1023456789', '3114456677', 'mariana@email.com', TRUE),
('Diana Toro', '52999887', '3129987744', 'diana@email.com', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO products (name, sku, brand, price_buy, price_sell, active, provider_id)
VALUES
('Shampoo Kativa', 'MM-0001', 'Kativa', 14500, 29000, TRUE, 1),
('Acondicionador Wella', 'MM-0002', 'Wella', 14000, 28000, TRUE, 2)
ON DUPLICATE KEY UPDATE name = VALUES(name);