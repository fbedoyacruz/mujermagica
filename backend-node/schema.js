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

    const [columns] = await conn.query("SHOW COLUMNS FROM products LIKE 'precio_venta_mayorista'");
    if (columns.length === 0) {
      await conn.query("ALTER TABLE products ADD COLUMN precio_venta_mayorista DECIMAL(12,2) DEFAULT NULL");
    }

    const [productActiveColumn] = await conn.query("SHOW COLUMNS FROM products LIKE 'activo'");
    if (productActiveColumn.length === 0) {
      await conn.query("ALTER TABLE products ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE");
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
