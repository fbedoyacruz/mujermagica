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
  } finally {
    conn.release();
  }
}

module.exports = ensureSchema;
