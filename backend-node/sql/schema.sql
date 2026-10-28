-- Esquema para el prototipo sistema-completo.html
-- Ejecutar sobre la base de datos `mujermagicabd` (ya creada en MySQL Workbench)
USE mujermagicabd;

CREATE TABLE IF NOT EXISTS providers (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  contacto VARCHAR(150),
  telefono VARCHAR(50),
  email VARCHAR(150)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  documento VARCHAR(50),
  telefono VARCHAR(50),
  correo VARCHAR(150)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  categoria VARCHAR(100),
  marca VARCHAR(100),
  precio_venta_detal DECIMAL(12,2) DEFAULT 0,
  precio_venta_mayorista DECIMAL(12,2) DEFAULT NULL,
  precio_compra DECIMAL(12,2) DEFAULT 0,
  stock_actual INT DEFAULT 0,
  stock_minimo INT DEFAULT 0,
  proveedor_id VARCHAR(50),
  imagen VARCHAR(255),
  activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(50) PRIMARY KEY,
  fecha DATETIME NOT NULL,
  cliente_id VARCHAR(50) NULL,
  subtotal DECIMAL(12,2) DEFAULT 0,
  iva DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  metodo_pago VARCHAR(50)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer_credits (
  id VARCHAR(50) PRIMARY KEY,
  sale_id VARCHAR(50) NOT NULL UNIQUE,
  customer_id VARCHAR(50) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  fecha DATETIME NOT NULL,
  INDEX idx_customer_credits_customer_fecha (customer_id, fecha),
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer_payments (
  id VARCHAR(50) PRIMARY KEY,
  credit_id VARCHAR(50) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  fecha DATETIME NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL,
  observaciones VARCHAR(500),
  INDEX idx_customer_payments_credit_fecha (credit_id, fecha),
  FOREIGN KEY (credit_id) REFERENCES customer_credits(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  cantidad INT NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  stock_descontado BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  precio_sugerido DECIMAL(12,2) NULL,
  costo_sugerido DECIMAL(12,2) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_service_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id VARCHAR(50) NOT NULL,
  service_id VARCHAR(50) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  cantidad INT NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  costo DECIMAL(12,2) NULL,
  observaciones VARCHAR(500),
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO services (id, nombre, precio_sugerido, costo_sugerido, activo)
SELECT 'svc_alisado', 'Alisado', NULL, NULL, TRUE WHERE NOT EXISTS (SELECT 1 FROM services WHERE nombre = 'Alisado')
UNION ALL SELECT 'svc_terapia_capilar', 'Terapia capilar', NULL, NULL, TRUE WHERE NOT EXISTS (SELECT 1 FROM services WHERE nombre = 'Terapia capilar')
UNION ALL SELECT 'svc_hidratacion', 'Hidratación', NULL, NULL, TRUE WHERE NOT EXISTS (SELECT 1 FROM services WHERE nombre = 'Hidratación')
UNION ALL SELECT 'svc_henna', 'Henna', NULL, NULL, TRUE WHERE NOT EXISTS (SELECT 1 FROM services WHERE nombre = 'Henna')
UNION ALL SELECT 'svc_lifting_pestanas', 'Lifting de pestañas', NULL, NULL, TRUE WHERE NOT EXISTS (SELECT 1 FROM services WHERE nombre = 'Lifting de pestañas');

UPDATE services
SET nombre = 'Lifting de pestañas'
WHERE LOWER(TRIM(nombre)) = 'litfing pestañas';

UPDATE services AS seeded
INNER JOIN services AS existing ON existing.nombre = seeded.nombre AND existing.id <> seeded.id
SET seeded.activo = FALSE
WHERE seeded.id IN ('svc_alisado', 'svc_terapia_capilar', 'svc_hidratacion', 'svc_henna', 'svc_lifting_pestanas');

CREATE TABLE IF NOT EXISTS purchases (
  id VARCHAR(50) PRIMARY KEY,
  fecha DATETIME NOT NULL,
  proveedor_id VARCHAR(50),
  iva DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  observaciones VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  cantidad INT NOT NULL,
  costo DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS movements (
  id VARCHAR(50) PRIMARY KEY,
  fecha DATETIME NOT NULL,
  usuario VARCHAR(100),
  tipo_movimiento VARCHAR(50),
  cantidad INT,
  producto_id VARCHAR(50),
  proveedor_id VARCHAR(50) NULL,
  cliente_id VARCHAR(50) NULL,
  documento VARCHAR(255)
) ENGINE=InnoDB;
