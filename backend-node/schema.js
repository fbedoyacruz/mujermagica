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

    const customerPaymentColumns = [
      ["comision_porcentaje", "DECIMAL(5,2) NULL"],
      ["comision_valor", "DECIMAL(12,2) NOT NULL DEFAULT 0"],
      ["comision_entidad_porcentaje", "DECIMAL(5,2) NULL"],
      ["comision_entidad_valor", "DECIMAL(12,2) NOT NULL DEFAULT 0"],
      ["monto_cobrado", "DECIMAL(12,2) NULL"],
      ["neto_recibido", "DECIMAL(12,2) NULL"],
      ["saldo_anterior", "DECIMAL(12,2) NULL"],
      ["saldo_posterior", "DECIMAL(12,2) NULL"]
    ];
    for (const [column, definition] of customerPaymentColumns) {
      const [existingColumn] = await conn.query(`SHOW COLUMNS FROM customer_payments LIKE '${column}'`);
      if (existingColumn.length === 0) {
        await conn.query(`ALTER TABLE customer_payments ADD COLUMN ${column} ${definition}`);
      }
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

    const [purchaseCostColumn] = await conn.query("SHOW COLUMNS FROM sale_items LIKE 'costo_compra'");
    if (purchaseCostColumn.length === 0) {
      await conn.query("ALTER TABLE sale_items ADD COLUMN costo_compra DECIMAL(12,2) NULL");
    }

    const [discountTypeColumn] = await conn.query("SHOW COLUMNS FROM sale_items LIKE 'descuento_tipo'");
    if (discountTypeColumn.length === 0) {
      await conn.query("ALTER TABLE sale_items ADD COLUMN descuento_tipo VARCHAR(20) NOT NULL DEFAULT 'fijo'");
    }

    const [discountValueColumn] = await conn.query("SHOW COLUMNS FROM sale_items LIKE 'descuento_valor'");
    if (discountValueColumn.length === 0) {
      await conn.query("ALTER TABLE sale_items ADD COLUMN descuento_valor DECIMAL(12,2) NOT NULL DEFAULT 0");
    }
  } finally {
    conn.release();
  }
}

module.exports = ensureSchema;
