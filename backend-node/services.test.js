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
    document: { getElementById: id => elements[id] || (id === "toastHost" ? null : ({ value: id === "metodoSelect" ? "Efectivo" : "", setAttribute: () => {} })) },
    localStorage: { getItem: () => null, setItem: () => {} },
    setTimeout: () => {}, setInterval: () => {}
  });
  new vm.Script(script);
  vm.runInContext(script.slice(0, script.indexOf("    // ==================== EVENTOS")), context);
  vm.runInContext("db = fixture; renderView = () => {}; updateCartBadge = () => {}; cerrarModal = () => {};", context);
  return context;
}

function saleDeletionFrontend(state, code = "AdminTest9") {
  const handlers = {};
  const elements = {
    modalContent: { innerHTML: "" }, modalBackdrop: { classList: { add: () => {} } },
    saleDeletionForm: { addEventListener: (event, handler) => { handlers[event] = handler; } },
    saleDeletionCode: { value: code, disabled: false, focus: () => {} },
    saleDeletionError: { textContent: "" }, confirmSaleDeletion: { disabled: false }, cancelSaleDeletion: { disabled: false }
  };
  return { app: frontend(state, elements), elements, handlers };
}

function backend(pool, env = {}) {
  const context = vm.createContext({ require: name => name === "./db" ? pool : require(name), process: { env }, module: { exports: {} }, Date, Map });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "state.js"), "utf8"), context);
  return context.module.exports;
}

test("fecha de nacimiento persiste como fecha civil y admite clientes antiguos", async () => {
  const inserts = [];
  const conn = { query: async (sql, values) => { if (sql.startsWith("INSERT INTO customers ")) inserts.push(values); return [[]]; }, beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {} };
  const store = backend({
    getConnection: async () => conn,
    query: async sql => {
      if (sql.includes("FROM customers")) {
        assert.match(sql, /DATE_FORMAT\(fecha_nacimiento, '%Y-%m-%d'\) AS fechaNacimiento/);
        return [[{ id: "customer_1", nombre: "Ana", fechaNacimiento: "1990-12-31" }]];
      }
      return [[]];
    }
  });
  const state = fixture();
  state.customers = [{ id: "customer_1", nombre: "Ana", fechaNacimiento: "1990-12-31" }, { id: "customer_2", nombre: "Luisa" }];
  await store.replaceState(state);
  assert.equal(inserts[0][5], "1990-12-31");
  assert.equal(inserts[1][5], null);
  assert.equal((await store.getState()).customers[0].fechaNacimiento, "1990-12-31");
  assert.match(html, /id="customerBirthDate"/);
});

test("migración de nacimiento agrega la columna solo si falta", async () => {
  for (const missing of [true, false]) {
    const queries = [];
    const conn = { query: async sql => { queries.push(sql); return sql.startsWith("SHOW COLUMNS") ? [missing ? [] : [{ Field: "existing" }]] : [[]]; }, release: () => {} };
    const pool = { getConnection: async () => conn };
    const context = vm.createContext({ require: name => name === "./db" ? pool : require(name), module: { exports: {} }, __dirname });
    vm.runInContext(fs.readFileSync(path.join(__dirname, "schema.js"), "utf8"), context);
    await context.module.exports();
    assert.equal(queries.filter(sql => sql === "ALTER TABLE customers ADD COLUMN fecha_nacimiento DATE NULL").length, missing ? 1 : 0);
    assert.equal(queries.filter(sql => sql === "ALTER TABLE products ADD COLUMN codigo_barras VARCHAR(100) NULL").length, missing ? 1 : 0);
    assert.equal(queries.filter(sql => sql === "ALTER TABLE products ADD UNIQUE KEY uq_products_codigo_barras (codigo_barras)").length, 1);
    assert.equal(queries.filter(sql => sql === "ALTER TABLE sales ADD COLUMN comision_porcentaje DECIMAL(5,2) NULL").length, missing ? 1 : 0);
    assert.equal(queries.filter(sql => sql === "ALTER TABLE sales ADD COLUMN comision_valor DECIMAL(12,2) NOT NULL DEFAULT 0").length, missing ? 1 : 0);
    assert.equal(queries.filter(sql => sql === "ALTER TABLE sales ADD COLUMN neto_recibido DECIMAL(12,2) NULL").length, missing ? 1 : 0);
  }
});

test("editar nacimiento revierte un fallo de guardado y permite reintentar", async () => {
  const state = fixture();
  state.customers = [{ id: "customer_1", nombre: "Ana", documento: "123", fechaNacimiento: null }];
  const handlers = {};
  const elements = {
    modalContent: { appendChild: () => {} }, modalBackdrop: { classList: { add: () => {} } },
    btnCancelCustomer: { addEventListener: () => {} }, customerForm: { addEventListener: (event, handler) => { handlers[event] = handler; } },
    customerName: { value: "Ana" }, customerDoc: { value: "123" }, customerPhone: { value: "" }, customerEmail: { value: "" }, customerBirthDate: { value: "1990-05-10" }
  };
  const app = frontend(state, elements);
  app.document.createElement = () => ({});
  app.showEditCustomerModal("customer_1");
  vm.runInContext("saveDB = async () => false;", app);
  await handlers.submit({ preventDefault: () => {} });
  assert.equal(vm.runInContext("db.customers[0].fechaNacimiento", app), null);
  vm.runInContext("saveDB = async () => true;", app);
  await handlers.submit({ preventDefault: () => {} });
  assert.equal(vm.runInContext("db.customers[0].fechaNacimiento", app), "1990-05-10");
  elements.customerBirthDate.value = "2999-05-10";
  await handlers.submit({ preventDefault: () => {} });
  assert.equal(vm.runInContext("db.customers[0].fechaNacimiento", app), "1990-05-10");
});

test("cumpleaños incluye hoy y siete días, cruza el año e ignora fechas inválidas", () => {
  const app = frontend();
  const customers = [
    { id: "today", nombre: "Ana", fechaNacimiento: "1990-12-29" },
    { id: "nextYear", nombre: "Luisa", fechaNacimiento: "1985-01-05" },
    { id: "outside", nombre: "Fuera", fechaNacimiento: "1985-01-06" },
    { id: "past", nombre: "Pasado", fechaNacimiento: "1985-12-28" },
    { id: "empty", nombre: "Sin fecha" },
    { id: "invalid", nombre: "Inválida", fechaNacimiento: "2000-02-30" },
    { id: "future", nombre: "Futura", fechaNacimiento: "2027-01-01" }
  ];
  const alerts = app.getUpcomingBirthdays(customers, new Date(2026, 11, 29));
  assert.deepEqual(Array.from(alerts, alert => [alert.customerId, alert.daysUntil]), [["today", 0], ["nextYear", 7]]);
  assert.equal(alerts[1].fecha, "2027-01-05");
  const leapCustomer = [{ id: "leap", nombre: "Bisiesto", fechaNacimiento: "2000-02-29" }];
  assert.equal(app.getUpcomingBirthdays(leapCustomer, new Date(2027, 1, 28))[0].daysUntil, 0);
  assert.equal(app.getUpcomingBirthdays(leapCustomer, new Date(2028, 1, 28))[0].daysUntil, 1);
});

test("cumpleaños se revisa una vez al día y no repite aviso al recargar", () => {
  const state = fixture();
  state.customers = [{ id: "birthday_1", nombre: "Ana", fechaNacimiento: "1990-12-31" }];
  const badge = {};
  const writes = [];
  const storage = new Map();
  const app = frontend(state, { birthdayCount: badge });
  app.localStorage = { getItem: key => storage.get(key), setItem: (key, value) => { storage.set(key, value); writes.push(value); } };
  assert.equal(app.revisarCumpleanos(new Date(2026, 11, 29)), true);
  assert.equal(badge.textContent, 1);
  assert.equal(app.revisarCumpleanos(new Date(2026, 11, 29)), false);
  app.revisarCumpleanos(new Date(2026, 11, 29), true);
  assert.equal(writes.length, 1);
  const reloaded = frontend(state);
  reloaded.localStorage = app.localStorage;
  reloaded.revisarCumpleanos(new Date(2026, 11, 29));
  assert.equal(writes.length, 1);
  app.revisarCumpleanos(new Date(2026, 11, 30));
  assert.equal(writes.length, 2);
  assert.match(app.renderBirthdayAlerts(), /openBirthdayCustomer\('birthday_1'\)/);
  assert.match(app.renderClientes(state), /31\/12\/1990/);
  assert.match(app.renderClientes(state), /Cumpleaños de Ana/);
});

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

test("lector de barras agrega por código, conserva ceros iniciales y respeta stock/modalidad", () => {
  const state = fixture();
  state.products[0].codigoBarras = "165840";
  state.products[0].stockActual = 2;
  const scanner = { value: "165840" };
  const app = frontend(state, { barcodeScannerInput: scanner });
  const pos = app.renderPOS(state);
  const catalog = app.renderProductos(state);
  assert.match(pos, /id="barcodeScannerInput"/);
  assert.match(pos, /handleBarcodeScanner\(event\)/);
  assert.match(catalog, /Código de barras/);
  assert.match(html, /id="productBarcode"/);

  let prevented = false;
  app.handleBarcodeScanner({ key: "Enter", preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(scanner.value, "");
  assert.equal(state.products[0].codigoBarras, "165840");
  assert.equal(vm.runInContext("appState.cart[0].productId", app), "product_1");
  assert.equal(vm.runInContext("appState.cart[0].cantidad", app), 1);

  app.procesarCodigoBarras("165840");
  assert.equal(vm.runInContext("appState.cart[0].cantidad", app), 2);
  app.procesarCodigoBarras("165840");
  assert.equal(vm.runInContext("appState.cart[0].cantidad", app), 2);

  const wholesaleState = fixture();
  wholesaleState.products[0].codigoBarras = "165840";
  wholesaleState.products[0].precioVentaMayorista = null;
  const wholesaleApp = frontend(wholesaleState);
  wholesaleApp.setPosTab("mayorista");
  wholesaleApp.procesarCodigoBarras("165840");
  assert.equal(vm.runInContext("appState.cart.length", wholesaleApp), 0);
});

test("métodos de pago conservan los valores existentes e incluyen opciones adicionales", () => {
  const app = frontend();
  const methods = JSON.parse(vm.runInContext("JSON.stringify(paymentMethods)", app));
  assert.deepEqual(methods.map(method => method.value), [
    "Efectivo", "Tarjeta", "Tarjeta débito", "Transferencia", "Nequi", "Daviplata", "QR", "SisteCredito", "Addi", "Otro", "Credito"
  ]);
});

test("selector de comisión se requiere para tarjetas, QR, SisteCrédito y Addi", () => {
  const commissionGroup = { hidden: true, classList: { toggle: (className, hidden) => { commissionGroup.hidden = hidden; } } };
  const commissionSelect = { required: false, value: "" };
  const commissionAmountRow = { dataset: { base: "20000" }, hidden: true, classList: { toggle: (className, hidden) => { commissionAmountRow.hidden = hidden; } } };
  const entityFeeRow = { hidden: true, classList: { toggle: (className, hidden) => { entityFeeRow.hidden = hidden; } } };
  const netReceivedRow = { hidden: true, classList: { toggle: (className, hidden) => { netReceivedRow.hidden = hidden; } } };
  const methodSelect = { value: "Tarjeta" };
  const elements = {
    metodoSelect: methodSelect,
    commissionGroup,
    commissionSelect,
    commissionAmountRow,
    entityFeeRow,
    netReceivedRow,
    commissionAmountLabel: { textContent: "" },
    commissionAmountValue: { textContent: "" },
    entityFeeLabel: { textContent: "" },
    entityFeeValue: { textContent: "" },
    checkoutTotal: { textContent: "" },
    netReceivedValue: { textContent: "" }
  };
  const app = frontend(fixture(), elements);

  app.actualizarCampoComision();
  assert.equal(commissionGroup.hidden, false);
  assert.equal(commissionSelect.required, true);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(commissionRates)", app)), [1.5, 2, 3, 4, 5]);

  for (const method of ["Tarjeta débito", "QR", "SisteCredito", "Addi"]) {
    methodSelect.value = method;
    app.actualizarCampoComision();
    assert.equal(commissionGroup.hidden, false);
    assert.equal(commissionSelect.required, true);
  }
  methodSelect.value = "Tarjeta";
  commissionSelect.value = "3";
  app.actualizarResumenComision();
  assert.equal(commissionAmountRow.hidden, false);
  assert.equal(elements.checkoutTotal.textContent, vm.runInContext("formatCurrency(20600)", app));
  assert.equal(elements.commissionAmountValue.textContent, vm.runInContext("formatCurrency(600)", app));
  assert.equal(netReceivedRow.hidden, false);
  assert.equal(entityFeeRow.hidden, false);
  assert.equal(elements.entityFeeValue.textContent, vm.runInContext("formatCurrency(850)", app));
  assert.equal(elements.entityFeeLabel.textContent, `Retención bancaria (2,67% + ${vm.runInContext("formatCurrency(300)", app)}):`);
  assert.equal(elements.netReceivedValue.textContent, vm.runInContext("formatCurrency(19750)", app));
  methodSelect.value = "SisteCredito";
  commissionSelect.value = "3";
  app.actualizarResumenComision();
  assert.equal(entityFeeRow.hidden, false);
  assert.equal(elements.entityFeeLabel.textContent, "Retención SisteCrédito (2%):");
  assert.equal(elements.entityFeeValue.textContent, vm.runInContext("formatCurrency(412)", app));
  assert.equal(netReceivedRow.hidden, false);
  assert.equal(elements.netReceivedValue.textContent, vm.runInContext("formatCurrency(20188)", app));
  methodSelect.value = "Efectivo";
  commissionSelect.value = "3";
  app.actualizarCampoComision();
  assert.equal(commissionGroup.hidden, true);
  assert.equal(commissionSelect.required, false);
  assert.equal(commissionSelect.value, "");
  assert.equal(entityFeeRow.hidden, true);
  assert.equal(netReceivedRow.hidden, true);
});

test("SisteCrédito y Addi cobran comisión al cliente y retienen 2% del total facturado", async () => {
  for (const metodoPago of ["SisteCredito", "Addi"]) {
    const state = fixture();
    const elements = {
      clienteSelect: { value: "" }, metodoSelect: { value: metodoPago }, commissionSelect: { value: "3" },
      modalContent: { innerHTML: "", appendChild: element => { elements.invoiceMarkup = element.innerHTML; } },
      modalBackdrop: { classList: { add: () => {} } }, thermalPrintRoot: { innerHTML: "" }
    };
    const app = frontend(state, elements);
    app.document.createElement = () => ({ className: "", innerHTML: "" });
    app.cartFixture = [{ productId: "product_1", nombre: "Shampoo", cantidad: 1, precio: 100000 }];
    vm.runInContext("appState.cart = cartFixture; saveDB = async () => true;", app);

    await app.confirmarVenta();

    assert.equal(state.sales[0].metodoPago, metodoPago);
    assert.equal(state.sales[0].comisionValor, 3000);
    assert.equal(state.sales[0].total, 103000);
    assert.equal(state.sales[0].comisionEntidadPorcentaje, 2);
    assert.equal(state.sales[0].comisionEntidadValor, 2060);
    assert.equal(state.sales[0].netoRecibido, 100940);
    app.verFactura(state.sales[0].id);
    assert.match(elements.invoiceMarkup, /Comisión \(3%\)/);
    assert.doesNotMatch(elements.invoiceMarkup, /Retención|2%/);
    assert.doesNotMatch(elements.thermalPrintRoot.innerHTML, /Retención|2%/);
  }
});

test("QR preselecciona 1.5 por ciento y calcula el importe sobre el subtotal", () => {
  const commissionGroup = { hidden: true, classList: { toggle: (className, hidden) => { commissionGroup.hidden = hidden; } } };
  const commissionSelect = { required: false, value: "" };
  const commissionAmountRow = { dataset: { base: "20000" }, hidden: true, classList: { toggle: (className, hidden) => { commissionAmountRow.hidden = hidden; } } };
  const entityFeeRow = { hidden: true, classList: { toggle: (className, hidden) => { entityFeeRow.hidden = hidden; } } };
  const netReceivedRow = { hidden: true, classList: { toggle: (className, hidden) => { netReceivedRow.hidden = hidden; } } };
  const elements = {
    metodoSelect: { value: "QR" }, commissionGroup, commissionSelect, commissionAmountRow, entityFeeRow, netReceivedRow,
    commissionAmountLabel: { textContent: "" }, commissionAmountValue: { textContent: "" }, entityFeeLabel: { textContent: "" }, entityFeeValue: { textContent: "" }, checkoutTotal: { textContent: "" }, netReceivedValue: { textContent: "" }
  };
  const app = frontend(fixture(), elements);
  app.actualizarCampoComision();
  assert.equal(commissionSelect.value, "1.5");
  assert.equal(elements.commissionAmountLabel.textContent, "Comisión bancaria QR (1.5%):");
  assert.equal(elements.commissionAmountValue.textContent, vm.runInContext("formatCurrency(300)", app));
  assert.equal(elements.checkoutTotal.textContent, vm.runInContext("formatCurrency(20000)", app));
  assert.equal(entityFeeRow.hidden, true);
  assert.equal(elements.netReceivedRow.hidden, false);
  assert.equal(elements.netReceivedValue.textContent, vm.runInContext("formatCurrency(19700)", app));
});

test("venta suma comisión calculada al total, la discrimina y exige selección", async () => {
  const state = fixture();
  const elements = { clienteSelect: { value: "" }, metodoSelect: { value: "Tarjeta" }, commissionSelect: { value: "3" } };
  const app = frontend(state, elements);
  app.cartFixture = [{ productId: "product_1", nombre: "Shampoo", cantidad: 1, precio: 20000 }];
  vm.runInContext("appState.cart = cartFixture; saveDB = async () => true;", app);

  await app.confirmarVenta();
  assert.equal(state.sales[0].metodoPago, "Tarjeta");
  assert.equal(state.sales[0].comisionPorcentaje, 3);
  assert.equal(state.sales[0].comisionValor, 600);
  assert.equal(state.sales[0].subtotal, 20000);
  assert.equal(state.sales[0].total, 20600);
  assert.equal(state.sales[0].comisionEntidadPorcentaje, 2.67);
  assert.equal(state.sales[0].comisionEntidadValor, 850);
  assert.equal(state.sales[0].netoRecibido, 19750);

  const missingCommissionState = fixture();
  const missingCommissionApp = frontend(missingCommissionState, { clienteSelect: { value: "" }, metodoSelect: { value: "QR" }, commissionSelect: { value: "" } });
  missingCommissionApp.cartFixture = [{ productId: "product_1", nombre: "Shampoo", cantidad: 1, precio: 20000 }];
  vm.runInContext("appState.cart = cartFixture; saveDB = async () => true;", missingCommissionApp);
  await missingCommissionApp.confirmarVenta();
  assert.equal(missingCommissionState.sales.length, 0);
});

test("tarjetas crédito y débito retienen 2.67% del total más 300 sin imprimir el descuento bancario", async () => {
  for (const metodoPago of ["Tarjeta", "Tarjeta débito"]) {
    const state = fixture();
    const elements = {
      clienteSelect: { value: "" }, metodoSelect: { value: metodoPago }, commissionSelect: { value: "5" },
      modalContent: { innerHTML: "", appendChild: element => { elements.invoiceMarkup = element.innerHTML; } },
      modalBackdrop: { classList: { add: () => {} } }, thermalPrintRoot: { innerHTML: "" }
    };
    const app = frontend(state, elements);
    app.document.createElement = () => ({ className: "", innerHTML: "" });
    app.cartFixture = [{ productId: "product_1", nombre: "Shampoo", cantidad: 1, precio: 100000 }];
    vm.runInContext("appState.cart = cartFixture; saveDB = async () => true;", app);
    await app.confirmarVenta();
    const sale = state.sales[0];
    assert.equal(sale.comisionValor, 5000);
    assert.equal(sale.total, 105000);
    assert.equal(sale.comisionEntidadPorcentaje, 2.67);
    assert.equal(sale.comisionEntidadValor, 3104);
    assert.equal(sale.netoRecibido, 101896);
    app.verFactura(sale.id);
    for (const markup of [elements.invoiceMarkup, elements.thermalPrintRoot.innerHTML]) {
      assert.match(markup, /Comisión \(5%\)/);
      assert.ok(markup.includes(vm.runInContext("formatCurrency(105000)", app)));
      assert.doesNotMatch(markup, /Retención|2[.,]67|3\.104|101\.896/);
    }
    vm.runInContext(`appState.historyMode = "date"; appState.historyDate = getLocalDateInputValue("${sale.fecha}");`, app);
    const dailyHistory = app.renderVentas(state);
    assert.match(dailyHistory, /\$\s?3\.104/);
    assert.match(dailyHistory, /\$\s?101\.896/);
  }
});

test("QR conserva factura bruta, descuenta comisión solo del neto de caja y no la imprime", async () => {
  const state = fixture();
  const elements = {
    clienteSelect: { value: "" }, metodoSelect: { value: "QR" }, commissionSelect: { value: "1.5" },
    modalContent: { innerHTML: "", appendChild: element => { elements.invoiceMarkup = element.innerHTML; } },
    modalBackdrop: { classList: { add: () => {} } }, thermalPrintRoot: { innerHTML: "" }
  };
  const app = frontend(state, elements);
  app.document.createElement = () => ({ className: "", innerHTML: "" });
  app.cartFixture = [{ productId: "product_1", nombre: "Shampoo", cantidad: 5, precio: 20000 }];
  vm.runInContext("appState.cart = cartFixture; saveDB = async () => true;", app);

  await app.confirmarVenta();
  const sale = state.sales[0];
  assert.equal(sale.subtotal, 100000);
  assert.equal(sale.comisionPorcentaje, 1.5);
  assert.equal(sale.comisionValor, 1500);
  assert.equal(sale.comisionEntidadPorcentaje, 1.5);
  assert.equal(sale.comisionEntidadValor, 1500);
  assert.equal(sale.total, 100000);
  assert.equal(sale.netoRecibido, 98500);

  app.verFactura(sale.id);
  const formattedGrossTotal = vm.runInContext("formatCurrency(100000)", app);
  assert.ok(elements.invoiceMarkup.includes(formattedGrossTotal));
  assert.doesNotMatch(elements.invoiceMarkup, /Comisión \(1\.5%\)/);
  assert.ok(elements.thermalPrintRoot.innerHTML.includes(formattedGrossTotal));
  assert.doesNotMatch(elements.thermalPrintRoot.innerHTML, /Comisión \(1\.5%\)/);

  vm.runInContext(`appState.historyMode = "date"; appState.historyDate = getLocalDateInputValue("${sale.fecha}");`, app);
  const dailyHistory = app.renderVentas(state);
  assert.match(dailyHistory, /Total facturado/);
  assert.match(dailyHistory, /Comisiones bancarias \/ plataforma/);
  assert.match(dailyHistory, /Neto recibido para caja/);
  assert.match(dailyHistory, /\$\s?98\.500/);
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
  const { app, elements } = saleDeletionFrontend(state);
  vm.runInContext("saveDB = async () => true", app);
  await app.eliminarVenta("sale_1");
  assert.equal(state.sales.length, 1);
  assert.equal(state.products[0].stockActual, 8);
  assert.match(elements.modalContent.innerHTML, /Código de autorización/);
  assert.match(elements.modalContent.innerHTML, /type="password"/);
  await app.confirmarEliminarVenta("sale_1");
  assert.equal(state.sales.length, 0);
  assert.equal(state.products[0].stockActual, 10);
  assert.equal(elements.saleDeletionCode.value, "");

  state.products[0].stockActual = 8;
  state.sales = [{ id: "sale_2", total: 40000, items: [{ productId: "product_1", cantidad: 2, precio: 20000, stockDescontado: true }] }];
  const { app: failedSaveApp, elements: failedElements } = saleDeletionFrontend(state);
  vm.runInContext("saveDB = async () => false", failedSaveApp);
  await failedSaveApp.eliminarVenta("sale_2");
  await failedSaveApp.confirmarEliminarVenta("sale_2");
  assert.equal(state.sales.length, 1);
  assert.equal(state.products[0].stockActual, 8);
  assert.equal(failedElements.saleDeletionCode.value, "");
  assert.match(failedElements.saleDeletionError.textContent, /No se eliminó/);
  failedElements.saleDeletionCode.value = "NuevoIntento9";
  vm.runInContext("saveDB = async () => true", failedSaveApp);
  await failedSaveApp.confirmarEliminarVenta("sale_2");
  assert.equal(state.sales.length, 0);
  assert.equal(state.products[0].stockActual, 10);
});

test("modal de eliminación rechaza códigos vacíos o no alfanuméricos sin guardar", async () => {
  for (const code of ["", " ", "codigo-con-guion", "A".repeat(129)]) {
    const state = fixture();
    state.sales = [{ id: "sale_1", total: 0, items: [] }];
    const { app, elements } = saleDeletionFrontend(state, code);
    vm.runInContext("saveDB = async () => { throw new Error('No debe guardar'); };", app);
    await app.eliminarVenta("sale_1");
    await app.confirmarEliminarVenta("sale_1");
    assert.equal(state.sales.length, 1);
    assert.match(elements.saleDeletionError.textContent, /alfanumérico/);
  }
});

test("autorización viaja solo en la cabecera y un rechazo del backend conserva venta y stock", async () => {
  const state = fixture();
  state.products[0].stockActual = 8;
  state.sales = [{ id: "sale_1", total: 40000, items: [{ productId: "product_1", cantidad: 2, precio: 20000 }] }];
  const { app, elements } = saleDeletionFrontend(state);
  let requests = 0;
  let finishRequest;
  app.fetch = async (url, options) => {
    requests++;
    assert.match(url, /\/api\/state$/);
    assert.equal(options.headers["X-Sale-Delete-Code"], "AdminTest9");
    assert.equal(options.body.includes("AdminTest9"), false);
    return new Promise(resolve => {
      finishRequest = () => resolve({ ok: false, status: 403, json: async () => ({ error: "Código incorrecto" }) });
    });
  };
  await app.eliminarVenta("sale_1");
  assert.equal(requests, 0);
  const pending = app.confirmarEliminarVenta("sale_1");
  assert.equal(elements.confirmSaleDeletion.disabled, true);
  assert.equal(elements.cancelSaleDeletion.disabled, true);
  await app.confirmarEliminarVenta("sale_1");
  assert.equal(requests, 1);
  finishRequest();
  await pending;
  assert.equal(elements.confirmSaleDeletion.disabled, false);
  assert.equal(elements.cancelSaleDeletion.disabled, false);
  assert.equal(state.sales.length, 1);
  assert.equal(state.products[0].stockActual, 8);
  assert.equal(elements.saleDeletionCode.value, "");
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
  assert.ok(catalog.includes('class="w-full min-w-[1100px] table-fixed text-sm"'));
  assert.ok(catalog.includes('class="w-[20%] px-3 py-2 text-left">Producto'));
  assert.ok(catalog.includes('>Código de barras</th>'));
  assert.ok(catalog.includes('class="break-words px-3 py-2 font-semibold"'));
  assert.ok(catalog.includes(`class="px-3 py-2 text-right">${vm.runInContext("formatCurrency(20000)", app)}</td>`));
  assert.ok(catalog.includes(`class="px-3 py-2 text-right">${vm.runInContext("formatCurrency(10000)", app)}</td>`));
  assert.ok(catalog.includes('class="w-[10%] px-3 py-2 text-left">Estado'));
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
  const conn = { query: async (sql, values) => { queries.push({ sql, values }); return [[]]; }, beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {} };
  const store = backend({ getConnection: async () => conn });
  const state = fixture();
  state.sales = [{ id: "sale_1", fecha: "2026-10-13T12:00:00Z", subtotal: 230000, iva: 0, total: 236900, metodoPago: "SisteCredito", comisionPorcentaje: 3, comisionValor: 6900, netoRecibido: 232162, comisionEntidadPorcentaje: 2, comisionEntidadValor: 4738, items: [
    { productId: "product_1", cantidad: 1, precio: 20000 }, { ...serviceItem, costo: null }, { ...serviceItem, costo: 0 }
  ] }];
  state.customers = [{ id: "customer_1", nombre: "Pepito" }];
  state.customerCredits = [{ id: "credit_1", saleId: "sale_1", customerId: "customer_1", monto: 20000, fecha: "2026-10-13T12:00:00Z" }];
  state.customerPayments = [{ id: "payment_1", creditId: "credit_1", monto: 5000, fecha: "2026-10-14T12:00:00Z", metodoPago: "Nequi", observaciones: "Abono inicial" }];
  state.products[0].activo = false;
  state.products[0].codigoBarras = "00165840";
  state.providers = [{ id: "provider_1", nombre: "Proveedor", activo: false }];
  state.sales[0].comisionValor = 6900;
  state.sales[0].items[0].stockDescontado = false;
  await store.replaceState(state);
  const providerInsert = queries.find(query => query.sql.startsWith("INSERT INTO providers "));
  assert.equal(providerInsert.values[5], false);
  const productInsert = queries.find(query => query.sql.startsWith("INSERT INTO products "));
  assert.equal(productInsert.values[5], 15000);
  assert.equal(productInsert.values[11], false);
  assert.equal(productInsert.values[12], "00165840");
  const saleInsert = queries.find(query => query.sql.startsWith("INSERT INTO sales "));
  assert.equal(saleInsert.values[7], 3);
  assert.equal(saleInsert.values[8], 6900);
  assert.equal(saleInsert.values[9], 232162);
  assert.equal(saleInsert.values[10], 2);
  assert.equal(saleInsert.values[11], 4738);
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

test("backend exige autorización antes de borrar ventas desde cualquier reemplazo de estado", async () => {
  for (const [configuredCode, suppliedCode, expectedStatus] of [
    [undefined, "AdminTest9", 503], ["", "AdminTest9", 503],
    ["AdminTest9", undefined, 403], ["AdminTest9", "OtroCodigo", 403],
    ["AdminTest9", "admintest9", 403], ["AdminTest9", "", 403],
    ["AdminTest9", "AdminTest9", null]
  ]) {
    const queries = [];
    let rolledBack = false;
    let released = false;
    const conn = {
      query: async sql => { queries.push(sql); return sql.startsWith("SELECT id FROM sales") ? [[{ id: "sale_1" }]] : [[]]; },
      beginTransaction: async () => {}, commit: async () => {},
      rollback: async () => { rolledBack = true; }, release: () => { released = true; }
    };
    const store = backend({ getConnection: async () => conn }, { SALE_DELETE_AUTH_CODE: configuredCode });
    if (expectedStatus) {
      await assert.rejects(store.replaceState(fixture(), suppliedCode), error => error.status === expectedStatus);
      assert.equal(queries.some(sql => /^(DELETE|TRUNCATE|INSERT)/.test(sql)), false);
      assert.equal(rolledBack, true);
    } else {
      await store.replaceState(fixture(), suppliedCode);
      assert.equal(queries.includes("TRUNCATE TABLE sales"), true);
    }
    assert.equal(released, true);
  }
});

test("guardar sin quitar ventas no exige un código de autorización", async () => {
  const conn = {
    query: async sql => sql.startsWith("SELECT id FROM sales") ? [[{ id: "sale_1" }]] : [[]],
    beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {}
  };
  const state = fixture();
  state.sales = [{ id: "sale_1", fecha: "2026-10-30T12:00:00Z", total: 0, items: [] }];
  await backend({ getConnection: async () => conn }).replaceState(state);
});

test("esquema de cartera y comisiones evita incompatibilidades con tablas antiguas", () => {
  const schema = fs.readFileSync(path.join(__dirname, "sql/schema.sql"), "utf8");
  const creditsTable = /CREATE TABLE IF NOT EXISTS customer_credits \(([\s\S]*?)\) ENGINE=InnoDB/.exec(schema)?.[1] || "";
  const salesTable = /CREATE TABLE IF NOT EXISTS sales \(([\s\S]*?)\) ENGINE=InnoDB/.exec(schema)?.[1] || "";
  assert.ok(creditsTable.includes("sale_id VARCHAR(50) NOT NULL UNIQUE"));
  assert.ok(creditsTable.includes("customer_id VARCHAR(50) NOT NULL"));
  assert.doesNotMatch(creditsTable, /FOREIGN KEY/i);
  assert.match(salesTable, /comision_porcentaje DECIMAL\(5,2\) NULL/);
  assert.match(salesTable, /comision_valor DECIMAL\(12,2\) NOT NULL DEFAULT 0/);
  assert.match(salesTable, /neto_recibido DECIMAL\(12,2\) NULL/);
  assert.match(salesTable, /comision_entidad_porcentaje DECIMAL\(5,2\) NULL/);
  assert.match(salesTable, /comision_entidad_valor DECIMAL\(12,2\) NOT NULL DEFAULT 0/);
  assert.match(schema, /FOREIGN KEY \(credit_id\) REFERENCES customer_credits\(id\) ON DELETE CASCADE/);
});

test("lectura conserva el nombre historico aunque cambie el catalogo", async () => {
  const tables = {
    providers: [{ id: "provider_1", nombre: "Proveedor", activo: 0 }],
    products: [{ id: "product_1", nombre: "Shampoo", precioVentaDetal: "20000.00", precioCompra: "10000.00", codigoBarras: "00165840", activo: 1 }],
    services: [{ id: "service_1", nombre: "Nuevo nombre", precioSugerido: "200000.00", costoSugerido: null, activo: 0 }],
    sales: [{ id: "sale_1", subtotal: "180000.00", total: "185400.00", iva: "0.00", metodoPago: "Addi", comisionPorcentaje: "3.00", comisionValor: "5400.00", netoRecibido: "181692.00", comisionEntidadPorcentaje: "2.00", comisionEntidadValor: "3708.00" }],
    customer_credits: [{ id: "credit_1", saleId: "sale_1", customerId: "customer_1", monto: "500000.00", fecha: "2026-10-15T12:00:00Z" }],
    customer_payments: [{ id: "payment_1", creditId: "credit_1", monto: "150000.00", fecha: "2026-10-16T12:00:00Z", metodoPago: "Nequi", observaciones: "Abono" }],
    sale_service_items: [{ saleId: "sale_1", serviceId: "service_1", nombre: "Alisado", cantidad: 1, precio: "180000.00", costo: "0.00", observaciones: "Cabello largo" }]
  };
  const store = backend({ query: async sql => [tables[/FROM (\w+)/.exec(sql)[1]] || []] });
  const state = await store.getState();
  assert.equal(state.providers[0].activo, false);
  assert.equal(state.products[0].codigoBarras, "00165840");
  assert.equal(state.services[0].activo, false);
  assert.equal(state.services[0].costoSugerido, null);
  assert.equal(state.sales[0].items[0].nombre, "Alisado");
  assert.equal(state.sales[0].items[0].precio, 180000);
  assert.equal(state.sales[0].items[0].costo, 0);
  assert.equal(state.sales[0].items[0].tipo, "servicio");
  assert.equal(state.sales[0].comisionPorcentaje, 3);
  assert.equal(state.sales[0].comisionValor, 5400);
  assert.equal(state.sales[0].netoRecibido, 181692);
  assert.equal(state.sales[0].comisionEntidadPorcentaje, 2);
  assert.equal(state.sales[0].comisionEntidadValor, 3708);
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

test("recibo para impresora térmica de 58 mm incluye datos y detalle sin imprimir la aplicación", () => {
  const state = fixture();
  state.customers = [{ id: "customer_1", nombre: "María López", documento: "12345" }];
  state.sales = [{ id: "sale_thermal_1", fecha: "2026-10-29T12:00:00Z", clienteId: "customer_1", metodoPago: "Efectivo", subtotal: 230000, iva: 0, total: 230000, items: [
    { productId: "product_1", cantidad: 2, precio: 25000 },
    { ...serviceItem, nombre: "Terapia capilar", precio: 180000, observaciones: "Cabello largo" }
  ] }];
  let invoiceMarkup = "";
  const printRoot = { innerHTML: "" };
  let printCalls = 0;
  const app = frontend(state, {
    modalContent: { innerHTML: "", appendChild: element => { invoiceMarkup = element.innerHTML; } },
    modalBackdrop: { classList: { add: () => {}, remove: () => {} } },
    thermalPrintRoot: printRoot
  });
  app.document.createElement = () => ({ className: "", innerHTML: "" });
  app.window = { print: () => { printCalls += 1; } };
  app.verFactura("sale_thermal_1");
  assert.match(printRoot.innerHTML, /id="thermalReceipt"/);
  assert.match(printRoot.innerHTML, /ANDRE CG/);
  assert.match(printRoot.innerHTML, /María López/);
  assert.match(printRoot.innerHTML, /12345/);
  assert.match(printRoot.innerHTML, /Terapia capilar/);
  assert.match(printRoot.innerHTML, /Cabello largo/);
  assert.match(printRoot.innerHTML, /IVA/);
  assert.match(printRoot.innerHTML, /RECIBO DE VENTA/);
  assert.match(printRoot.innerHTML, /src="Logo_AndreCG_thermal\.png"/);
  assert.match(printRoot.innerHTML, /ANDRE CG/);
  assert.match(printRoot.innerHTML, /Mujer Mágica - Tienda de belleza/);
  assert.match(printRoot.innerHTML, /Centro comercial Feria de los Plátanos, local 3 - Armenia/);
  assert.match(printRoot.innerHTML, /Tel: 3175769914/);
  assert.doesNotMatch(printRoot.innerHTML, /900\.123\.456-7/);
  assert.ok(fs.existsSync(path.join(__dirname, "../Fuentes/Logo_AndreCG.jpg")));
  assert.ok(fs.existsSync(path.join(__dirname, "../Fuentes/Logo_AndreCG_thermal.png")));
  assert.match(html, /@page \{ margin: 0; \}/);
  assert.match(html, /width: 48mm !important/);
  assert.match(html, /body > :not\(#thermalPrintRoot\) \{ display: none !important/);
  assert.doesNotMatch(html, /#thermalReceipt \{ position: fixed/);
  app.imprimirFactura();
  assert.equal(printCalls, 1);
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

test("proveedores se muestran en tabla y protegen historial al eliminar", async () => {
  const state = fixture();
  state.providers = [{ id: "provider_1", nombre: "Proveedor Uno", contacto: "Ana", telefono: "123", email: "ana@example.com", activo: false }];
  const app = frontend(state);
  const table = vm.runInContext("renderProveedores(fixture)", app);
  assert.match(table, /<table/);
  assert.match(table, /Proveedor Uno/);
  assert.match(table, /Inactivo/);
  assert.match(table, /setProviderActive\('provider_1', true\)/);
  assert.match(table, /eliminarProveedor\('provider_1'\)/);

  state.products[0].proveedor = "provider_1";
  await app.eliminarProveedor("provider_1");
  assert.equal(state.providers.length, 1);
});

test("proveedor inactivo conserva su estado al guardar y puede reactivarse", async () => {
  const state = fixture();
  const provider = { id: "provider_1", nombre: "Proveedor Uno", activo: false };
  state.providers.push(provider);
  const app = frontend(state);
  vm.runInContext("saveDB = async () => true;", app);
  await app.setProviderActive("provider_1", true);
  assert.equal(provider.activo, true);
});