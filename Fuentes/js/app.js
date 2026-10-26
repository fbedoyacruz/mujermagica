import { db } from "./database.js";
import { renderDashboard } from "./dashboard.js";
import { renderProducts } from "./products.js";
import { renderProviders } from "./providers.js";
import { renderCustomers } from "./customers.js";
import { renderInventory } from "./inventory.js";
import { renderPurchases } from "./purchases.js";
import { renderSales } from "./sales.js";
import { renderInvoice } from "./invoice.js";
import { renderReports } from "./reports.js";
import { showToast, uid } from "./utils.js";

const routes = [
  { id: "dashboard", label: "Dashboard", icon: "D", title: "Dashboard", subtitle: "Vision general del negocio", render: (state, search) => renderDashboard(state, search) },
  { id: "products", label: "Productos", icon: "P", title: "Productos", subtitle: "Catalogo y stock", render: (state, search) => renderProducts(state, search) },
  { id: "providers", label: "Proveedores", icon: "R", title: "Proveedores", subtitle: "Abastecimiento", render: (state, search) => renderProviders(state, search) },
  { id: "customers", label: "Clientes", icon: "C", title: "Clientes", subtitle: "Base comercial", render: (state, search) => renderCustomers(state, search) },
  { id: "inventory", label: "Inventario", icon: "I", title: "Inventario", subtitle: "Existencias y ubicacion", render: (state, search) => renderInventory(state, search) },
  { id: "purchases", label: "Compras", icon: "M", title: "Compras", subtitle: "Ingresos al stock", render: (state) => renderPurchases(state) },
  { id: "sales", label: "POS", icon: "V", title: "POS Ventas", subtitle: "Punto de venta", render: (state) => renderSales(state) },
  { id: "invoice", label: "Factura", icon: "F", title: "Facturacion", subtitle: "Documento de venta", render: (state) => renderInvoice(state) },
  { id: "reports", label: "Reportes", icon: "T", title: "Reportes", subtitle: "Indicadores y analitica", render: (state) => renderReports(state) }
];

const appState = {
  currentRoute: "dashboard",
  searchTerm: ""
};

const $view = document.getElementById("appView");
const $sidebar = document.getElementById("sidebarNav");
const $title = document.getElementById("viewTitle");
const $crumb = document.getElementById("breadcrumb");
const $search = document.getElementById("globalSearch");
const $quickAction = document.getElementById("quickAction");
const $clock = document.getElementById("liveClock");
const $modal = document.getElementById("modalBackdrop");
const $modalContent = document.getElementById("modalContent");

function closeModal() {
  if (!$modal) return;
  $modal.classList.add("hidden");
  if ($modalContent) {
    $modalContent.innerHTML = "";
  }
}

function openModal(content) {
  if (!$modal || !$modalContent) return;
  $modalContent.innerHTML = content;
  $modal.classList.remove("hidden");
}

function productFormMarkup(product) {
  const isNew = !product;

  return `
    <div class="mx-auto w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="font-heading text-xl font-bold text-slate-900">${isNew ? "Nuevo producto" : "Editar producto"}</h3>
          <p class="mt-1 text-sm text-slate-500">Actualiza los datos de la hoja PRODUCTOS.</p>
        </div>
        <button type="button" class="btn-close-modal rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600">Cerrar</button>
      </div>
      <form id="productForm" class="mt-5 space-y-3">
        <input type="hidden" id="productId" value="${product?.id || ""}" />
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="space-y-1 text-sm font-semibold text-slate-700">Marca<input id="productBrand" type="text" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${product?.marca || ""}" required /></label>
          <label class="space-y-1 text-sm font-semibold text-slate-700">Producto<input id="productName" type="text" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${product?.nombre || ""}" required /></label>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="space-y-1 text-sm font-semibold text-slate-700">SKU<input id="productSku" type="text" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${product?.sku || ""}" required /></label>
          <label class="space-y-1 text-sm font-semibold text-slate-700">VR. Inicial<input id="productVrInicial" type="number" min="0" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${product?.vrInicial ?? ""}" required /></label>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label class="space-y-1 text-sm font-semibold text-slate-700">VR. X Mayor<input id="productVrXMayor" type="number" min="0" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${product?.vrXMayor ?? ""}" required /></label>
          <label class="space-y-1 text-sm font-semibold text-slate-700">VR. Venta<input id="productVrVenta" type="number" min="0" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${product?.vrVenta ?? ""}" required /></label>
          <label class="space-y-1 text-sm font-semibold text-slate-700">Ganancia Cliente<input id="productGananciaCliente" type="number" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${product?.gananciaCliente ?? 0}" required /></label>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label class="space-y-1 text-sm font-semibold text-slate-700">Ganancia X Mayor<input id="productGananciaXMayor" type="number" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${product?.gananciaXMayor ?? 0}" required /></label>
          <label class="space-y-1 text-sm font-semibold text-slate-700">Ganancia Detal<input id="productGananciaDetal" type="number" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${product?.gananciaDetal ?? 0}" required /></label>
          <label class="space-y-1 text-sm font-semibold text-slate-700">% Detal<input id="productPctDetal" type="number" step="0.0001" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${product?.pctDetal ?? 0}" required /></label>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="space-y-1 text-sm font-semibold text-slate-700">% X Mayor<input id="productPctXMayor" type="number" step="0.0001" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${product?.pctXMayor ?? 0}" required /></label>
        </div>
        <div class="flex flex-col gap-2 pt-3 md:flex-row">
          <button type="button" class="btn-close-modal rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
          <button type="submit" class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">${isNew ? "Crear producto" : "Guardar cambios"}</button>
        </div>
      </form>
    </div>
  `;
}

function providerFormMarkup(provider) {
  const isNew = !provider;
  return `
    <div class="mx-auto w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="font-heading text-xl font-bold text-slate-900">${isNew ? "Nuevo proveedor" : "Editar proveedor"}</h3>
          <p class="mt-1 text-sm text-slate-500">Mantén actualizada la información de abastecimiento.</p>
        </div>
        <button type="button" class="btn-close-modal rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600">Cerrar</button>
      </div>
      <form id="providerForm" class="mt-5 space-y-3">
        <input type="hidden" id="providerId" value="${provider?.id || ""}" />
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="space-y-1 text-sm font-semibold text-slate-700">Nombre<input id="providerName" type="text" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${provider?.nombre || ""}" required /></label>
          <label class="space-y-1 text-sm font-semibold text-slate-700">Contacto<input id="providerContact" type="text" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${provider?.contacto || ""}" required /></label>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="space-y-1 text-sm font-semibold text-slate-700">Teléfono<input id="providerPhone" type="text" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${provider?.telefono || ""}" /></label>
          <label class="space-y-1 text-sm font-semibold text-slate-700">Correo<input id="providerEmail" type="email" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${provider?.correo || ""}" /></label>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="space-y-1 text-sm font-semibold text-slate-700">Dirección<input id="providerAddress" type="text" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${provider?.direccion || ""}" /></label>
          <label class="space-y-1 text-sm font-semibold text-slate-700">Ciudad<input id="providerCity" type="text" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${provider?.ciudad || ""}" /></label>
        </div>
        <div class="flex flex-col gap-2 pt-3 md:flex-row">
          <button type="button" class="btn-close-modal rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
          <button type="submit" class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">${isNew ? "Crear proveedor" : "Guardar cambios"}</button>
        </div>
      </form>
    </div>
  `;
}

function customerFormMarkup(customer) {
  const isNew = !customer;
  return `
    <div class="mx-auto w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="font-heading text-xl font-bold text-slate-900">${isNew ? "Nuevo cliente" : "Editar cliente"}</h3>
          <p class="mt-1 text-sm text-slate-500">Actualiza la base comercial para ventas y reportes.</p>
        </div>
        <button type="button" class="btn-close-modal rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600">Cerrar</button>
      </div>
      <form id="customerForm" class="mt-5 space-y-3">
        <input type="hidden" id="customerId" value="${customer?.id || ""}" />
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="space-y-1 text-sm font-semibold text-slate-700">Nombre<input id="customerName" type="text" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${customer?.nombre || ""}" required /></label>
          <label class="space-y-1 text-sm font-semibold text-slate-700">Documento<input id="customerDocument" type="text" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${customer?.documento || ""}" required /></label>
        </div>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="space-y-1 text-sm font-semibold text-slate-700">Teléfono<input id="customerPhone" type="text" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${customer?.telefono || ""}" /></label>
          <label class="space-y-1 text-sm font-semibold text-slate-700">Correo<input id="customerEmail" type="email" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${customer?.correo || ""}" /></label>
        </div>
        <label class="space-y-1 text-sm font-semibold text-slate-700">Dirección<input id="customerAddress" type="text" class="w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" value="${customer?.direccion || ""}" /></label>
        <div class="flex flex-col gap-2 pt-3 md:flex-row">
          <button type="button" class="btn-close-modal rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button>
          <button type="submit" class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">${isNew ? "Crear cliente" : "Guardar cambios"}</button>
        </div>
      </form>
    </div>
  `;
}

function renderSidebar() {
  $sidebar.innerHTML = routes
    .map((route) => {
      const active = route.id === appState.currentRoute ? "active" : "";
      return `<button data-route="${route.id}" class="nav-link ${active}"><span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">${route.icon}</span><span>${route.label}</span></button>`;
    })
    .join("");
}

function renderView() {
  const route = routes.find((item) => item.id === appState.currentRoute) || routes[0];
  $title.textContent = route.title;
  $crumb.textContent = `Inicio / ${route.subtitle}`;
  $view.innerHTML = route.render(db, appState.searchTerm);
  renderSidebar();
}

function bindEvents() {
  $view.addEventListener("click", (event) => {
    const productCreate = event.target.closest(".btn-product-create");
    const productEdit = event.target.closest(".btn-product-edit");
    const providerCreate = event.target.closest(".btn-provider-create");
    const providerEdit = event.target.closest(".btn-provider-edit");
    const customerCreate = event.target.closest(".btn-customer-create");
    const customerEdit = event.target.closest(".btn-customer-edit");

    if (productCreate) {
      openModal(productFormMarkup(null));
      return;
    }

    if (productEdit) {
      const product = db.products.find((item) => item.id === productEdit.dataset.id);
      openModal(productFormMarkup(product || null));
      return;
    }

    if (providerCreate) {
      openModal(providerFormMarkup(null));
      return;
    }

    if (providerEdit) {
      const provider = db.providers.find((item) => item.id === providerEdit.dataset.id);
      openModal(providerFormMarkup(provider || null));
      return;
    }

    if (customerCreate) {
      openModal(customerFormMarkup(null));
      return;
    }

    if (customerEdit) {
      const customer = db.customers.find((item) => item.id === customerEdit.dataset.id);
      openModal(customerFormMarkup(customer || null));
    }
  });

  $modal?.addEventListener("click", (event) => {
    if (event.target === $modal) {
      closeModal();
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".btn-close-modal")) {
      closeModal();
    }
  });

  document.addEventListener("submit", (event) => {
    const productForm = event.target.closest("#productForm");
    const providerForm = event.target.closest("#providerForm");
    const customerForm = event.target.closest("#customerForm");

    if (productForm) {
      event.preventDefault();
      const id = document.getElementById("productId").value;
      const product = id ? db.products.find((item) => item.id === id) : null;
      const vrInicial = Number(document.getElementById("productVrInicial").value);
      const vrXMayor = Number(document.getElementById("productVrXMayor").value);
      const vrVenta = Number(document.getElementById("productVrVenta").value);

      const payload = {
        nombre: document.getElementById("productName").value.trim(),
        sku: document.getElementById("productSku").value.trim(),
        marca: document.getElementById("productBrand").value.trim(),
        vrInicial,
        vrXMayor,
        vrVenta,
        gananciaCliente: Number(document.getElementById("productGananciaCliente").value),
        gananciaXMayor: Number(document.getElementById("productGananciaXMayor").value),
        gananciaDetal: Number(document.getElementById("productGananciaDetal").value),
        pctDetal: Number(document.getElementById("productPctDetal").value),
        pctXMayor: Number(document.getElementById("productPctXMayor").value),
        precioCompra: vrInicial,
        precioVentaMayorista: vrXMayor,
        precioVentaDetal: vrVenta,
        costoPromedio: vrInicial,
        utilidad: Number(document.getElementById("productGananciaDetal").value)
      };

      if (!payload.nombre || !payload.sku || !payload.marca) {
        showToast("Completa los campos obligatorios", "warning");
        return;
      }

      if (product) {
        Object.assign(product, payload);
        product.descripcion = payload.nombre;
        product.categoria = product.categoria || "General";
        product.proveedor = product.proveedor || db.providers[0]?.nombre || "Sin proveedor";
        product.imagen = product.imagen || "images/shampoo_cebolla.jpg";
        product.fechaUltimaCompra = new Date().toISOString();
        showToast("Producto actualizado", "success");
      } else {
        db.products.push({
          id: uid("prod"),
          descripcion: payload.nombre,
          codigoBarras: `77000${String(db.products.length + 1).padStart(8, "0")}`,
          iva: 19,
          stockActual: 0,
          stockMinimo: 8,
          stockMaximo: 80,
          ubicacion: "SIN-UBICACION",
          categoria: "General",
          proveedor: db.providers[0]?.nombre || "Sin proveedor",
          imagen: "images/shampoo_cebolla.jpg",
          fechaIngreso: new Date().toISOString(),
          fechaUltimaCompra: new Date().toISOString(),
          activo: true,
          ...payload
        });
        showToast("Producto creado", "success");
      }

      closeModal();
      renderView();
      return;
    }

    if (providerForm) {
      event.preventDefault();
      const id = document.getElementById("providerId").value;
      const provider = id ? db.providers.find((item) => item.id === id) : null;
      const payload = {
        nombre: document.getElementById("providerName").value.trim(),
        contacto: document.getElementById("providerContact").value.trim(),
        telefono: document.getElementById("providerPhone").value.trim(),
        correo: document.getElementById("providerEmail").value.trim(),
        direccion: document.getElementById("providerAddress").value.trim(),
        ciudad: document.getElementById("providerCity").value.trim(),
        productos: provider?.productos || []
      };

      if (!payload.nombre || !payload.contacto) {
        showToast("Completa nombre y contacto", "warning");
        return;
      }

      if (provider) {
        Object.assign(provider, payload);
        showToast("Proveedor actualizado", "success");
      } else {
        db.providers.push({ id: uid("prov"), ...payload });
        showToast("Proveedor creado", "success");
      }

      closeModal();
      renderView();
      return;
    }

    if (customerForm) {
      event.preventDefault();
      const id = document.getElementById("customerId").value;
      const customer = id ? db.customers.find((item) => item.id === id) : null;
      const payload = {
        nombre: document.getElementById("customerName").value.trim(),
        documento: document.getElementById("customerDocument").value.trim(),
        telefono: document.getElementById("customerPhone").value.trim(),
        correo: document.getElementById("customerEmail").value.trim(),
        direccion: document.getElementById("customerAddress").value.trim()
      };

      if (!payload.nombre || !payload.documento) {
        showToast("Completa nombre y documento", "warning");
        return;
      }

      if (customer) {
        Object.assign(customer, payload);
        showToast("Cliente actualizado", "success");
      } else {
        db.customers.push({ id: uid("cli"), ...payload });
        showToast("Cliente creado", "success");
      }

      closeModal();
      renderView();
    }
  });

  $sidebar.addEventListener("click", (event) => {
    const target = event.target.closest("[data-route]");
    if (!target) return;
    appState.currentRoute = target.dataset.route;
    renderView();
  });

  $search.addEventListener("input", (event) => {
    appState.searchTerm = event.target.value;
    renderView();
  });

  $quickAction.addEventListener("click", () => {
    showToast("Fase 1 lista: estructura base inicializada", "success");
  });
}

function startClock() {
  const update = () => {
    $clock.textContent = new Intl.DateTimeFormat("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(new Date());
  };

  update();
  window.setInterval(update, 1000);
}

function bootstrap() {
  renderSidebar();
  renderView();
  bindEvents();
  startClock();
}

bootstrap();
