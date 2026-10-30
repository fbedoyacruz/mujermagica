const fs = require("fs");
const path = require("path");
const pool = require("./db");

// Crea las tablas si no existen, usando el mismo script de sql/schema.sql
async function ensureSchema() {
  const sqlPath = path.join(__dirname, "sql", "schema.sql");
  const raw = fs.readFileSync(sqlPath, "utf8");
  const statements = raw
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.toUpperCase().startsWith("USE "));

  const conn = await pool.getConnection();
  try {
    for (const statement of statements) {
      await conn.query(statement);
    }

    const [customerBirthDateColumn] = await conn.query("SHOW COLUMNS FROM customers LIKE 'fecha_nacimiento'");
    if (customerBirthDateColumn.length === 0) {
      await conn.query("ALTER TABLE customers ADD COLUMN fecha_nacimiento DATE NULL");
    }

    const [providerActiveColumn] = await conn.query("SHOW COLUMNS FROM providers LIKE 'activo'");
    if (providerActiveColumn.length === 0) {
      await conn.query("ALTER TABLE providers ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE");
    }

    const [columns] = await conn.query("SHOW COLUMNS FROM products LIKE 'precio_venta_mayorista'");
    if (columns.length === 0) {
      await conn.query("ALTER TABLE products ADD COLUMN precio_venta_mayorista DECIMAL(12,2) DEFAULT NULL");
    }

    const [productActiveColumn] = await conn.query("SHOW COLUMNS FROM products LIKE 'activo'");
    if (productActiveColumn.length === 0) {
      await conn.query("ALTER TABLE products ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE");
    }

    const [barcodeColumn] = await conn.query("SHOW COLUMNS FROM products LIKE 'codigo_barras'");
    if (barcodeColumn.length === 0) {
      await conn.query("ALTER TABLE products ADD COLUMN codigo_barras VARCHAR(100) NULL");
    }

    const [barcodeIndex] = await conn.query("SHOW INDEX FROM products WHERE Key_name = 'uq_products_codigo_barras'");
    if (barcodeIndex.length === 0) {
      await conn.query("ALTER TABLE products ADD UNIQUE KEY uq_products_codigo_barras (codigo_barras)");
    }

    const [saleCommissionColumn] = await conn.query("SHOW COLUMNS FROM sales LIKE 'comision_porcentaje'");
    if (saleCommissionColumn.length === 0) {
      await conn.query("ALTER TABLE sales ADD COLUMN comision_porcentaje DECIMAL(5,2) NULL");
    }

    const [saleCommissionValueColumn] = await conn.query("SHOW COLUMNS FROM sales LIKE 'comision_valor'");
    if (saleCommissionValueColumn.length === 0) {
      await conn.query("ALTER TABLE sales ADD COLUMN comision_valor DECIMAL(12,2) NOT NULL DEFAULT 0");
    }

    const [saleNetReceivedColumn] = await conn.query("SHOW COLUMNS FROM sales LIKE 'neto_recibido'");
    if (saleNetReceivedColumn.length === 0) {
      await conn.query("ALTER TABLE sales ADD COLUMN neto_recibido DECIMAL(12,2) NULL");
    }

    const [entityCommissionRateColumn] = await conn.query("SHOW COLUMNS FROM sales LIKE 'comision_entidad_porcentaje'");
    if (entityCommissionRateColumn.length === 0) {
      await conn.query("ALTER TABLE sales ADD COLUMN comision_entidad_porcentaje DECIMAL(5,2) NULL");
    }

    const [entityCommissionValueColumn] = await conn.query("SHOW COLUMNS FROM sales LIKE 'comision_entidad_valor'");
    if (entityCommissionValueColumn.length === 0) {
      await conn.query("ALTER TABLE sales ADD COLUMN comision_entidad_valor DECIMAL(12,2) NOT NULL DEFAULT 0");
    }

    const [stockDeductedColumn] = await conn.query("SHOW COLUMNS FROM sale_items LIKE 'stock_descontado'");
    if (stockDeductedColumn.length === 0) {
      await conn.query("ALTER TABLE sale_items ADD COLUMN stock_descontado BOOLEAN NOT NULL DEFAULT TRUE");
    }
  } finally {
    conn.release();
  }
}

module.exports = ensureSchema;
