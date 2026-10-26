const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "../Fuentes/sistema-completo.html"), "utf8");
const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(Boolean).join("\n");
const serviceItem = { tipo: "servicio", serviceId: "service_1", nombre: "Alisado", cantidad: 1, precio: 180000, costo: 30000, observaciones: "Cabello largo" };

function fixture() {
  return {
    products: [{ id: "product_1", nombre: "Shampoo", categoria: "Capilar", stockActual: 10, stockMinimo: 2, precioCompra: 10000 }],
    services: [{ id: "service_1", nombre: "Alisado nuevo", precioSugerido: 200000, costoSugerido: null, activo: true }],
    providers: [], customers: [], purchases: [], movements: [], sales: []
  };
}

function frontend(state = fixture(), elements = {}) {
  const context = vm.createContext({
    fixture: state, console, Intl, Date,
    document: { getElementById: id => elements[id] || (id === "toastHost" ? null : ({ value: id === "metodoSelect" ? "Efectivo" : "" })) },
    setTimeout: () => {}, setInterval: () => {}
  });
  new vm.Script(script);
  vm.runInContext(script.slice(0, script.indexOf("    // ==================== EVENTOS")), context);
  vm.runInContext("db = fixture; renderView = () => {}; updateCartBadge = () => {}; cerrarModal = () => {};", context);
  return context;
}

function backend(pool) {
  const context = vm.createContext({ require: () => pool, module: { exports: {} }, Date, Map });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "state.js"), "utf8"), context);
  return context.module.exports;
}

test("ventas mixtas separan ingresos y omiten ganancias de servicios sin costo", () => {
  const state = fixture();
  state.sales = [{ total: 250000, items: [
    { productId: "product_1", cantidad: 1, precio: 20000 }, serviceItem,
    { ...serviceItem, serviceId: "service_2", nombre: "Henna", precio: 50000, costo: null }
  ] }];
  const app = frontend(state);
  const metrics = app.calcularMetricasGenerales(state.sales);
  assert.equal(metrics.totalVentas, 250000);
  assert.equal(metrics.ingresosProductos, 20000);
  assert.equal(metrics.ingresosServicios, 230000);
  assert.equal(metrics.totalCostoProductos, 10000);
  assert.equal(metrics.gananciaBruta, 160000);
  assert.equal(metrics.serviciosSinCosto, 1);
  assert.equal(metrics.margenPromedio, 80);
  assert.equal(app.productosMasVendidos(state.sales).length, 1);
  assert.equal(app.ventasPorCategoria(state.sales).length, 1);
  state.sales[0].items[2].costo = 0;
  assert.equal(app.calcularMetricasGenerales(state.sales).gananciaBruta, 210000);
});

test("cobro mixto guarda el precio acordado y solo descuenta productos", async () => {
  const state = fixture();
  const app = frontend(state);
  app.cartFixture = [{ productId: "product_1", cantidad: 2, precio: 20000 }, { ...serviceItem }];
  vm.runInContext("appState.cart = cartFixture; saveDB = async () => true;", app);
  await app.confirmarVenta();
  assert.equal(state.products[0].stockActual, 8);
  assert.equal(state.sales[0].total, 220000);
  assert.equal(state.sales[0].items[1].nombre, "Alisado");
  assert.equal(state.sales[0].items[1].precio, 180000);
  assert.equal(state.sales[0].items[1].observaciones, "Cabello largo");
  assert.equal(vm.runInContext("appState.cart.length", app), 0);
});

test("cobro de servicios no altera existencias y un fallo conserva el carrito", async () => {
  const state = fixture();
  const app = frontend(state);
  app.cartFixture = [{ ...serviceItem }];
  vm.runInContext("appState.cart = cartFixture; saveDB = async () => true;", app);
  await app.confirmarVenta();
  assert.equal(state.products[0].stockActual, 10);
  app.cartFixture = [{ productId: "product_1", cantidad: 2, precio: 20000 }, { ...serviceItem }];
  vm.runInContext("appState.cart = cartFixture; saveDB = async () => false;", app);
  await app.confirmarVenta();
  assert.equal(state.products[0].stockActual, 10);
  assert.equal(vm.runInContext("db.sales.length", app), 1);
  assert.equal(vm.runInContext("appState.cart.length", app), 2);
});

test("guardar ventas usa tablas separadas y conserva costo nulo y cero", async () => {
  const queries = [];
  const conn = { query: async (sql, values) => { queries.push({ sql, values }); }, beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {} };
  const store = backend({ getConnection: async () => conn });
  const state = fixture();
  state.sales = [{ id: "sale_1", fecha: "2026-10-13T12:00:00Z", total: 230000, items: [
    { productId: "product_1", cantidad: 1, precio: 20000 }, { ...serviceItem, costo: null }, { ...serviceItem, costo: 0 }
  ] }];
  await store.replaceState(state);
  assert.equal(queries.filter(query => query.sql.startsWith("INSERT INTO sale_items ")).length, 1);
  const services = queries.filter(query => query.sql.startsWith("INSERT INTO sale_service_items "));
  assert.equal(services.length, 2);
  assert.equal(services[0].values[2], "Alisado");
  assert.equal(services[0].values[4], 180000);
  assert.equal(services[0].values[5], null);
  assert.equal(services[1].values[5], 0);
  assert.equal(services[0].values[6], "Cabello largo");
  assert.equal(queries.find(query => query.sql.startsWith("INSERT INTO services ")).values[3], null);
});

test("lectura conserva el nombre historico aunque cambie el catalogo", async () => {
  const tables = {
    services: [{ id: "service_1", nombre: "Nuevo nombre", precioSugerido: "200000.00", costoSugerido: null, activo: 0 }],
    sales: [{ id: "sale_1", subtotal: "180000.00", total: "180000.00", iva: "0.00" }],
    sale_service_items: [{ saleId: "sale_1", serviceId: "service_1", nombre: "Alisado", cantidad: 1, precio: "180000.00", costo: "0.00", observaciones: "Cabello largo" }]
  };
  const store = backend({ query: async sql => [tables[/FROM (\w+)/.exec(sql)[1]] || []] });
  const state = await store.getState();
  assert.equal(state.services[0].activo, false);
  assert.equal(state.services[0].costoSugerido, null);
  assert.equal(state.sales[0].items[0].nombre, "Alisado");
  assert.equal(state.sales[0].items[0].precio, 180000);
  assert.equal(state.sales[0].items[0].costo, 0);
  assert.equal(state.sales[0].items[0].tipo, "servicio");
});

test("servicios se filtran por mes sin entrar en inversion ni stock bajo", () => {
  const state = fixture();
  state.sales = [
    { fecha: "2026-09-30T12:00:00", total: 180000, items: [{ ...serviceItem }] },
    { fecha: "2026-10-01T12:00:00", total: 180000, items: [{ ...serviceItem }] }
  ];
  const app = frontend(state);
  vm.runInContext("appState.periodo = '2026-10'; calcularAlertas = () => {};", app);
  assert.equal(app.filterSalesByPeriod(state.sales, "2026-10").length, 1);
  const dashboard = app.renderDashboard(state);
  assert.match(dashboard, /100[.\s]000/);
  assert.match(app.renderReportes(state), /Alisado/);
  assert.equal(app.productosMasVendidos(state.sales).length, 0);
  assert.equal(app.ventasPorCategoria(state.sales).length, 0);
});

test("catalogo inicial contiene los cinco procedimientos con precios variables", () => {
  const app = frontend();
  const services = vm.runInContext("defaultServices", app);
  assert.deepEqual(Array.from(services, service => service.nombre), ["Alisado", "Terapia capilar", "Hidratación", "Henna", "Lifting de pestañas"]);
  assert.ok(services.every(service => service.precioSugerido === null && service.costoSugerido === null && service.activo));
  const schema = fs.readFileSync(path.join(__dirname, "sql/schema.sql"), "utf8");
  for (const id of ["svc_alisado", "svc_terapia_capilar", "svc_hidratacion", "svc_henna", "svc_lifting_pestanas"]) assert.match(schema, new RegExp(id));
  assert.match(schema, /WHERE NOT EXISTS \(SELECT 1 FROM services WHERE nombre = 'Alisado'\)/);
  assert.match(schema, /SET nombre = 'Lifting de pestañas'[\s\S]*litfing pestañas/);
});

test("POS agrega el servicio elegido del catalogo con valor y observaciones acordados", () => {
  const state = fixture();
  const elements = {
    posServicePrice: { value: "" },
    posServiceCost: { value: "" },
    posServiceNotes: { value: "Cabello largo" }
  };
  const app = frontend(state, elements);
  vm.runInContext("appState.posTab = 'servicios';", app);
  const markup = app.renderPOS(state);
  assert.match(markup, /id="posServiceSelect"/);
  assert.match(markup, /id="posServicePrice"/);
  assert.doesNotMatch(markup, /Agregar servicio<\/button>/);
  app.onPosServiceSelected("service_1");
  assert.equal(elements.posServicePrice.value, 200000);
  elements.posServicePrice.value = "180000";
  elements.posServiceCost.value = "30000";
  app.addSelectedServiceToCart();
  const cart = vm.runInContext("appState.cart", app);
  assert.equal(cart[0].serviceId, "service_1");
  assert.equal(cart[0].precio, 180000);
  assert.equal(cart[0].costo, 30000);
  assert.equal(cart[0].observaciones, "Cabello largo");
  assert.equal(state.products[0].stockActual, 10);
});

test("historial lista cada procedimiento cobrado y permite abrir su factura", () => {
  const state = fixture();
  state.customers = [{ id: "customer_1", nombre: "María" }];
  state.sales = [{ id: "sale_1", fecha: "2026-10-15T12:00:00Z", clienteId: "customer_1", metodoPago: "Tarjeta", total: 230000, items: [
    { productId: "product_1", cantidad: 1, precio: 50000 },
    { ...serviceItem, nombre: "Terapia capilar", precio: 180000, observaciones: "Cabello largo" },
    { ...serviceItem, nombre: "Henna", precio: 50000, costo: null, observaciones: "Castaño" }
  ] }];
  const app = frontend(state);
  vm.runInContext("appState.servicesTab = 'historial';", app);
  const history = app.renderServicios(state);
  assert.match(history, /Historial de realizados <span class="ml-1 text-xs">2<\/span>/);
  assert.match(history, /Terapia capilar/);
  assert.match(history, /Henna/);
  assert.match(history, /María/);
  assert.match(history, /Tarjeta/);
  assert.match(history, /verFactura\(this.dataset.saleId\)/);
  assert.doesNotMatch(history, /Shampoo/);
  assert.doesNotMatch(app.renderServicios(state, "Castaño"), /Terapia capilar/);
});

test("catalogo prioriza el servicio activo sobre una copia inicial inactiva", () => {
  const state = fixture();
  state.services = [
    { id: "service_existing", nombre: "Alisado", precioSugerido: 250000, costoSugerido: null, activo: true },
    { id: "svc_alisado", nombre: "Alisado", precioSugerido: null, costoSugerido: null, activo: false }
  ];
  const catalog = frontend(state).renderServicios(state);
  assert.equal((catalog.match(/>Alisado<\/td>/g) || []).length, 1);
  assert.match(catalog, /250[.\s]000/);
  assert.doesNotMatch(catalog, /Inactivo/);
});