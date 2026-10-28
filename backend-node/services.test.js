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
    products: [{ id: "product_1", nombre: "Shampoo", categoria: "Capilar", stockActual: 10, stockMinimo: 2, precioCompra: 10000, precioVentaDetal: 20000, precioVentaMayorista: 15000 }],
    services: [{ id: "service_1", nombre: "Alisado nuevo", precioSugerido: 200000, costoSugerido: null, activo: true }],
    providers: [], customers: [], purchases: [], movements: [], sales: [], customerCredits: [], customerPayments: []
  };
}

function frontend(state = fixture(), elements = {}) {
  const context = vm.createContext({
    fixture: state, console, Intl, Date,
    confirm: () => true,
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

test("POS usa tarifas por modalidad y separa el mismo producto por precio", () => {
  const state = fixture();
  const app = frontend(state);
  vm.runInContext('setPosTab("productos")', app);
  assert.equal(vm.runInContext("getPosPriceMode()", app), "detal");
  assert.equal(vm.runInContext("getProductSalePrice(fixture.products[0])", app), 20000);

  vm.runInContext(`
    appState.cart = [];
    addToCartQty("product_1", "Shampoo", 20000);
    setPosTab("mayorista");
    addToCartQty("product_1", "Shampoo", 15000);
  `, app);

  const cart = JSON.parse(vm.runInContext("JSON.stringify(appState.cart)", app));
  assert.deepEqual(cart.map(item => [item.precio, item.tipoPrecio]), [[20000, "detal"], [15000, "mayorista"]]);
  assert.equal(vm.runInContext("getProductSalePrice(fixture.products[0])", app), 15000);

  state.products[0].precioVentaMayorista = null;
  const missingWholesalePrice = vm.runInContext("getProductSalePrice(fixture.products[0])", app);
  vm.runInContext(`addToCartQty("product_1", "Shampoo", ${Number(missingWholesalePrice)})`, app);
  assert.equal(vm.runInContext("appState.cart.length", app), 2);
});

test("métodos de pago conservan los valores existentes e incluyen opciones adicionales", () => {
  const app = frontend();
  const methods = JSON.parse(vm.runInContext("JSON.stringify(paymentMethods)", app));
  assert.deepEqual(methods.map(method => method.value), [
    "Efectivo", "Tarjeta", "Tarjeta débito", "Transferencia", "Nequi", "Daviplata", "QR", "Otro", "Credito"
  ]);
});

test("venta a crédito exige cliente, descuenta stock y crea el saldo pendiente", async () => {
  const state = fixture();
  state.customers = [{ id: "customer_1", nombre: "Pepito", documento: "123" }];
  const app = frontend(state, { clienteSelect: { value: "customer_1" }, metodoSelect: { value: "Credito" } });
  app.cartFixture = [{ productId: "product_1", nombre: "Shampoo", cantidad: 2, precio: 20000 }];
  vm.runInContext("appState.cart = cartFixture; saveDB = async () => true", app);

  await app.confirmarVenta();

  assert.equal(state.sales[0].metodoPago, "Credito");
  assert.equal(state.products[0].stockActual, 8);
  assert.equal(state.customerCredits.length, 1);
  assert.equal(state.customerCredits[0].customerId, "customer_1");
  assert.equal(state.customerCredits[0].monto, 40000);

  const noCustomerState = fixture();
  const noCustomerApp = frontend(noCustomerState, { clienteSelect: { value: "" }, metodoSelect: { value: "Credito" } });
  noCustomerApp.cartFixture = [{ productId: "product_1", nombre: "Shampoo", cantidad: 1, precio: 20000 }];
  vm.runInContext("appState.cart = cartFixture; saveDB = async () => true", noCustomerApp);
  await noCustomerApp.confirmarVenta();
  assert.equal(noCustomerState.sales.length, 0);
  assert.equal(noCustomerState.products[0].stockActual, 10);
});

test("abono reduce el saldo del crédito y no permite excederlo", async () => {
  const state = fixture();
  state.customerCredits = [{ id: "credit_1", saleId: "sale_1", customerId: "customer_1", monto: 500000, fecha: "2026-10-28T12:00:00Z" }];
  const app = frontend(state);
  vm.runInContext("saveDB = async () => true", app);

  assert.equal(await app.registrarAbono("credit_1", 150000, "Nequi", "Primer abono"), true);
  assert.equal(app.getCreditBalance(state.customerCredits[0]), 350000);
  assert.equal(state.customerPayments[0].metodoPago, "Nequi");
  assert.equal(await app.registrarAbono("credit_1", 400000, "Efectivo"), false);
  assert.equal(state.customerPayments.length, 1);
});

test("Cartera presenta saldo por cliente, factura y movimientos de abono", () => {
  const state = fixture();
  state.customers = [{ id: "customer_1", nombre: "Pepito", documento: "123" }];
  state.sales = [{ id: "sale_1", clienteId: "customer_1", fecha: "2026-10-28T12:00:00Z", total: 500000, items: [] }];
  state.customerCredits = [{ id: "credit_1", saleId: "sale_1", customerId: "customer_1", monto: 500000, fecha: "2026-10-28T12:00:00Z" }];
  state.customerPayments = [{ id: "payment_1", creditId: "credit_1", monto: 150000, fecha: "2026-10-29T12:00:00Z", metodoPago: "Nequi", observaciones: "Abono inicial" }];
  const app = frontend(state);

  const cartera = app.renderCartera(state);
  assert.ok(cartera.includes("Cartera de clientes"));
  assert.ok(cartera.includes("Pepito"));
  assert.ok(cartera.includes("sale_1"));
  assert.ok(cartera.includes(vm.runInContext("formatCurrency(350000)", app)));
  assert.ok(cartera.includes("Nequi"));
  assert.ok(vm.runInContext('flatRoutes().some(route => route.id === "cartera")', app));
});

test("no se puede eliminar una venta a crédito que ya recibió abonos", async () => {
  const state = fixture();
  state.products[0].stockActual = 9;
  state.sales = [{ id: "sale_1", total: 20000, items: [{ productId: "product_1", cantidad: 1, precio: 20000, stockDescontado: true }] }];
  state.customerCredits = [{ id: "credit_1", saleId: "sale_1", customerId: "customer_1", monto: 20000, fecha: "2026-10-28T12:00:00Z" }];
  state.customerPayments = [{ id: "payment_1", creditId: "credit_1", monto: 5000, fecha: "2026-10-28T13:00:00Z", metodoPago: "Efectivo" }];
  const app = frontend(state);
  vm.runInContext("saveDB = async () => true", app);

  await app.eliminarVenta("sale_1");

  assert.equal(state.sales.length, 1);
  assert.equal(state.products[0].stockActual, 9);
});

test("eliminar venta restaura solo el stock descontado y revierte si falla el guardado", async () => {
  const state = fixture();
  state.products[0].stockActual = 8;
  state.sales = [{ id: "sale_1", total: 40000, items: [
    { productId: "product_1", cantidad: 2, precio: 20000, stockDescontado: true },
    { productId: "product_1", cantidad: 1, precio: 0, stockDescontado: false },
    { ...serviceItem }
  ] }];
  const app = frontend(state);
  vm.runInContext("saveDB = async () => true", app);
  await app.eliminarVenta("sale_1");
  assert.equal(state.sales.length, 0);
  assert.equal(state.products[0].stockActual, 10);

  state.products[0].stockActual = 8;
  state.sales = [{ id: "sale_2", total: 40000, items: [{ productId: "product_1", cantidad: 2, precio: 20000, stockDescontado: true }] }];
  const failedSaveApp = frontend(state);
  vm.runInContext("saveDB = async () => false", failedSaveApp);
  await failedSaveApp.eliminarVenta("sale_2");
  assert.equal(state.sales.length, 1);
  assert.equal(state.products[0].stockActual, 8);
});

test("desactivar oculta el producto del POS y borrar protege productos con historial", async () => {
  const state = fixture();
  const app = frontend(state);
  vm.runInContext("saveDB = async () => true", app);
  await app.setProductActive("product_1", false);
  assert.equal(state.products[0].activo, false);
  assert.doesNotMatch(app.renderPOS(state), /Shampoo/);

  state.sales = [{ id: "sale_1", items: [{ productId: "product_1", cantidad: 1 }] }];
  await app.eliminarProducto("product_1");
  assert.equal(state.products.length, 1);

  state.sales = [];
  await app.eliminarProducto("product_1");
  assert.equal(state.products.length, 0);
});

test("catálogo limita el ancho de Producto y permite envolver nombres largos", () => {
  const app = frontend();
  const catalog = app.renderProductos(fixture());
  assert.ok(catalog.includes('class="w-full min-w-[900px] table-fixed text-sm"'));
  assert.ok(catalog.includes('class="w-[24%] px-3 py-2 text-left">Producto'));
  assert.ok(catalog.includes('class="break-words px-3 py-2 font-semibold"'));
  assert.ok(catalog.includes(`class="px-3 py-2 text-right">${vm.runInContext("formatCurrency(20000)", app)}</td>`));
  assert.ok(catalog.includes(`class="px-3 py-2 text-right">${vm.runInContext("formatCurrency(10000)", app)}</td>`));
  assert.ok(catalog.includes('class="w-[12%] px-3 py-2 text-left">Estado'));
});

test("clientes se pueden editar y eliminar solo si no tienen ventas", async () => {
  const state = fixture();
  state.customers = [{ id: "customer_1", nombre: "María", documento: "123" }];
  const app = frontend(state);
  const customerList = app.renderClientes(state);
  assert.match(customerList, /showEditCustomerModal\('customer_1'\)/);
  assert.match(customerList, /eliminarCliente\('customer_1'\)/);

  state.sales = [{ id: "sale_1", clienteId: "customer_1", items: [] }];
  vm.runInContext("saveDB = async () => true", app);
  await app.eliminarCliente("customer_1");
  assert.equal(state.customers.length, 1);

  state.sales = [];
  await app.eliminarCliente("customer_1");
  assert.equal(state.customers.length, 0);
});

test("historial conserva todas las ventas y permite filtrar por fecha con total diario", () => {
  const state = fixture();
  state.sales = Array.from({ length: 22 }, (_, index) => ({
    id: `sale_${index + 1}`,
    fecha: index < 2 ? "2026-10-27T12:00:00Z" : "2026-10-28T12:00:00Z",
    clienteId: null,
    total: 1000,
    items: []
  }));
  const app = frontend(state);

  const allHistory = vm.runInContext("renderVentas(fixture)", app);
  assert.equal((allHistory.match(/<tr class=\"border-b text-sm\">/g) || []).length, 22);

  vm.runInContext('appState.historyMode = "date"; appState.historyDate = "2026-10-27";', app);
  const dailyHistory = vm.runInContext("renderVentas(fixture)", app);
  assert.match(dailyHistory, /sale_1/);
  assert.match(dailyHistory, /sale_2/);
  assert.doesNotMatch(dailyHistory, /sale_3/);
  assert.match(dailyHistory, /Ventas del día/);
  assert.match(dailyHistory, /\$\s?2\.000/);
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
  state.customers = [{ id: "customer_1", nombre: "Pepito" }];
  state.customerCredits = [{ id: "credit_1", saleId: "sale_1", customerId: "customer_1", monto: 20000, fecha: "2026-10-13T12:00:00Z" }];
  state.customerPayments = [{ id: "payment_1", creditId: "credit_1", monto: 5000, fecha: "2026-10-14T12:00:00Z", metodoPago: "Nequi", observaciones: "Abono inicial" }];
  state.products[0].activo = false;
  state.sales[0].items[0].stockDescontado = false;
  await store.replaceState(state);
  const productInsert = queries.find(query => query.sql.startsWith("INSERT INTO products "));
  assert.equal(productInsert.values[5], 15000);
  assert.equal(productInsert.values[11], false);
  assert.equal(queries.filter(query => query.sql.startsWith("INSERT INTO sale_items ")).length, 1);
  assert.equal(queries.find(query => query.sql.startsWith("INSERT INTO sale_items ")).values[4], false);
  assert.equal(queries.find(query => query.sql.startsWith("INSERT INTO customer_credits ")).values[2], "customer_1");
  assert.equal(queries.find(query => query.sql.startsWith("INSERT INTO customer_credits ")).values[3], 20000);
  assert.equal(queries.find(query => query.sql.startsWith("INSERT INTO customer_payments ")).values[2], 5000);
  assert.equal(queries.find(query => query.sql.startsWith("INSERT INTO customer_payments ")).values[4], "Nequi");
  const services = queries.filter(query => query.sql.startsWith("INSERT INTO sale_service_items "));
  assert.equal(services.length, 2);
  assert.equal(services[0].values[2], "Alisado");
  assert.equal(services[0].values[4], 180000);
  assert.equal(services[0].values[5], null);
  assert.equal(services[1].values[5], 0);
  assert.equal(services[0].values[6], "Cabello largo");
  assert.equal(queries.find(query => query.sql.startsWith("INSERT INTO services ")).values[3], null);
});

test("esquema de cartera evita foreign keys incompatibles con tablas antiguas", () => {
  const schema = fs.readFileSync(path.join(__dirname, "sql/schema.sql"), "utf8");
  const creditsTable = /CREATE TABLE IF NOT EXISTS customer_credits \(([\s\S]*?)\) ENGINE=InnoDB/.exec(schema)?.[1] || "";
  assert.ok(creditsTable.includes("sale_id VARCHAR(50) NOT NULL UNIQUE"));
  assert.ok(creditsTable.includes("customer_id VARCHAR(50) NOT NULL"));
  assert.doesNotMatch(creditsTable, /FOREIGN KEY/i);
  assert.match(schema, /FOREIGN KEY \(credit_id\) REFERENCES customer_credits\(id\) ON DELETE CASCADE/);
});

test("lectura conserva el nombre historico aunque cambie el catalogo", async () => {
  const tables = {
    services: [{ id: "service_1", nombre: "Nuevo nombre", precioSugerido: "200000.00", costoSugerido: null, activo: 0 }],
    sales: [{ id: "sale_1", subtotal: "180000.00", total: "180000.00", iva: "0.00" }],
    customer_credits: [{ id: "credit_1", saleId: "sale_1", customerId: "customer_1", monto: "500000.00", fecha: "2026-10-15T12:00:00Z" }],
    customer_payments: [{ id: "payment_1", creditId: "credit_1", monto: "150000.00", fecha: "2026-10-16T12:00:00Z", metodoPago: "Nequi", observaciones: "Abono" }],
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
  assert.equal(state.customerCredits[0].monto, 500000);
  assert.equal(state.customerPayments[0].monto, 150000);
  assert.equal(state.customerPayments[0].metodoPago, "Nequi");
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