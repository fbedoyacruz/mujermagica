const pool = require("./db");

// Convierte las filas de MySQL al mismo shape (camelCase) que usa sistema-completo.html
async function getState() {
  const [providers] = await pool.query("SELECT id, nombre, contacto, telefono, email FROM providers");
  const [customers] = await pool.query("SELECT id, nombre, documento, telefono, correo FROM customers");
  const [products] = await pool.query(
    "SELECT id, nombre, categoria, marca, precio_venta_detal AS precioVentaDetal, precio_venta_mayorista AS precioVentaMayorista, precio_compra AS precioCompra, stock_actual AS stockActual, stock_minimo AS stockMinimo, proveedor_id AS proveedor, imagen FROM products"
  );
  const [sales] = await pool.query(
    "SELECT id, fecha, cliente_id AS clienteId, subtotal, iva, total, metodo_pago AS metodoPago FROM sales ORDER BY fecha"
  );
  const [saleItems] = await pool.query(
    "SELECT sale_id AS saleId, product_id AS productId, cantidad, precio FROM sale_items"
  );
  const [services] = await pool.query("SELECT id, nombre, precio_sugerido AS precioSugerido, costo_sugerido AS costoSugerido, activo FROM services");
  const [serviceItems] = await pool.query("SELECT sale_id AS saleId, service_id AS serviceId, nombre, cantidad, precio, costo, observaciones FROM sale_service_items");
  const [purchases] = await pool.query(
    "SELECT id, fecha, proveedor_id AS proveedorId, iva, total, observaciones FROM purchases ORDER BY fecha"
  );
  const [purchaseItems] = await pool.query(
    "SELECT purchase_id AS purchaseId, product_id AS productId, cantidad, costo FROM purchase_items"
  );
  const [movements] = await pool.query(
    "SELECT id, fecha, usuario, tipo_movimiento AS tipoMovimiento, cantidad, producto_id AS productoId, proveedor_id AS proveedorId, cliente_id AS clienteId, documento FROM movements ORDER BY fecha"
  );

  const itemsBySale = new Map();
  for (const item of saleItems) {
    if (!itemsBySale.has(item.saleId)) itemsBySale.set(item.saleId, []);
    itemsBySale.get(item.saleId).push({ productId: item.productId, cantidad: item.cantidad, precio: Number(item.precio) });
  }
  for (const item of serviceItems) {
    if (!itemsBySale.has(item.saleId)) itemsBySale.set(item.saleId, []);
    itemsBySale.get(item.saleId).push({ tipo: "servicio", serviceId: item.serviceId, nombre: item.nombre, cantidad: item.cantidad, precio: Number(item.precio), costo: item.costo == null ? null : Number(item.costo), observaciones: item.observaciones || "" });
  }

  const itemsByPurchase = new Map();
  for (const item of purchaseItems) {
    if (!itemsByPurchase.has(item.purchaseId)) itemsByPurchase.set(item.purchaseId, []);
    itemsByPurchase.get(item.purchaseId).push({ productId: item.productId, cantidad: item.cantidad, costo: Number(item.costo) });
  }

  return {
    providers,
    customers,
    services: services.map(service => ({ ...service, precioSugerido: service.precioSugerido == null ? null : Number(service.precioSugerido), costoSugerido: service.costoSugerido == null ? null : Number(service.costoSugerido), activo: Boolean(service.activo) })),
    products: products.map(p => ({
      ...p,
      precioVentaDetal: Number(p.precioVentaDetal),
      precioVentaMayorista: p.precioVentaMayorista == null ? null : Number(p.precioVentaMayorista),
      precioCompra: Number(p.precioCompra)
    })),
    sales: sales.map(s => ({
      ...s,
      subtotal: Number(s.subtotal),
      iva: Number(s.iva),
      total: Number(s.total),
      items: itemsBySale.get(s.id) || []
    })),
    purchases: purchases.map(p => ({
      ...p,
      iva: Number(p.iva),
      total: Number(p.total),
      items: itemsByPurchase.get(p.id) || []
    })),
    movements,
    alerts: []
  };
}

// Reemplaza todo el contenido de las tablas con el estado recibido (snapshot completo, igual que localStorage)
async function replaceState(state) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    await conn.query("DELETE FROM sale_service_items");
    await conn.query("DELETE FROM services");
    await conn.query("TRUNCATE TABLE sale_items");
    await conn.query("TRUNCATE TABLE purchase_items");
    await conn.query("TRUNCATE TABLE movements");
    await conn.query("TRUNCATE TABLE sales");
    await conn.query("TRUNCATE TABLE purchases");
    await conn.query("TRUNCATE TABLE products");
    await conn.query("TRUNCATE TABLE customers");
    await conn.query("TRUNCATE TABLE providers");

    for (const p of state.providers || []) {
      await conn.query("INSERT INTO providers (id, nombre, contacto, telefono, email) VALUES (?, ?, ?, ?, ?)", [
        p.id, p.nombre, p.contacto || null, p.telefono || null, p.email || null
      ]);
    }

    for (const c of state.customers || []) {
      await conn.query("INSERT INTO customers (id, nombre, documento, telefono, correo) VALUES (?, ?, ?, ?, ?)", [
        c.id, c.nombre, c.documento || null, c.telefono || null, c.correo || null
      ]);
    }

    for (const p of state.products || []) {
      await conn.query(
        "INSERT INTO products (id, nombre, categoria, marca, precio_venta_detal, precio_venta_mayorista, precio_compra, stock_actual, stock_minimo, proveedor_id, imagen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [p.id, p.nombre, p.categoria || null, p.marca || null, p.precioVentaDetal || 0, p.precioVentaMayorista ?? null, p.precioCompra || 0, p.stockActual || 0, p.stockMinimo || 0, p.proveedor || null, p.imagen || null]
      );
    }

    for (const service of state.services || []) {
      await conn.query("INSERT INTO services (id, nombre, precio_sugerido, costo_sugerido, activo) VALUES (?, ?, ?, ?, ?)", [
        service.id, service.nombre, service.precioSugerido ?? null, service.costoSugerido ?? null, service.activo !== false
      ]);
    }

    for (const s of state.sales || []) {
      await conn.query("INSERT INTO sales (id, fecha, cliente_id, subtotal, iva, total, metodo_pago) VALUES (?, ?, ?, ?, ?, ?, ?)", [
        s.id, new Date(s.fecha), s.clienteId || null, s.subtotal || 0, s.iva || 0, s.total || 0, s.metodoPago || null
      ]);
      for (const item of s.items || []) {
        if (item.tipo === "servicio") {
          await conn.query("INSERT INTO sale_service_items (sale_id, service_id, nombre, cantidad, precio, costo, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?)", [
            s.id, item.serviceId, item.nombre, item.cantidad, item.precio, item.costo ?? null, item.observaciones || null
          ]);
          continue;
        }
        await conn.query("INSERT INTO sale_items (sale_id, product_id, cantidad, precio) VALUES (?, ?, ?, ?)", [
          s.id, item.productId, item.cantidad, item.precio
        ]);
      }
    }

    for (const p of state.purchases || []) {
      await conn.query("INSERT INTO purchases (id, fecha, proveedor_id, iva, total, observaciones) VALUES (?, ?, ?, ?, ?, ?)", [
        p.id, new Date(p.fecha), p.proveedorId || null, p.iva || 0, p.total || 0, p.observaciones || null
      ]);
      for (const item of p.items || []) {
        await conn.query("INSERT INTO purchase_items (purchase_id, product_id, cantidad, costo) VALUES (?, ?, ?, ?)", [
          p.id, item.productId, item.cantidad, item.costo
        ]);
      }
    }

    for (const m of state.movements || []) {
      await conn.query(
        "INSERT INTO movements (id, fecha, usuario, tipo_movimiento, cantidad, producto_id, proveedor_id, cliente_id, documento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [m.id, new Date(m.fecha), m.usuario || null, m.tipoMovimiento || null, m.cantidad || 0, m.productoId || null, m.proveedorId || null, m.clienteId || null, m.documento || null]
      );
    }

    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { getState, replaceState };
