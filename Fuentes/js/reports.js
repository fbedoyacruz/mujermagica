import { formatCurrency, formatDate } from "./utils.js";

export function renderReports(state) {
  const inventoryValue = state.products.reduce((sum, item) => sum + item.costoPromedio * item.stockActual, 0);
  const soldValue = state.sales.reduce((sum, sale) => sum + sale.total, 0);
  const salesCount = state.sales.length;
  const averageTicket = salesCount > 0 ? soldValue / salesCount : 0;
  const inventoryPotential = state.products.reduce((sum, item) => sum + item.precioVentaDetal * item.stockActual, 0);
  const topProduct = state.products.reduce((best, item) => (item.stockActual > (best?.stockActual ?? -1) ? item : best), null);
  const topCustomer = state.customers[0] || null;
  const latestSale = state.sales[0] || null;

  return `
    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article class="view-card">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Ventas registradas</p>
        <h3 class="mt-2 text-2xl font-extrabold text-slate-900">${salesCount}</h3>
        <p class="text-sm text-slate-500">Ticket promedio: ${formatCurrency(averageTicket, state.settings.moneda)}</p>
      </article>
      <article class="view-card">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Reporte de ventas</p>
        <h3 class="mt-2 text-2xl font-extrabold text-slate-900">${formatCurrency(soldValue, state.settings.moneda)}</h3>
        <p class="text-sm text-slate-500">Total vendido en registros activos.</p>
      </article>
      <article class="view-card">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Valor de inventario</p>
        <h3 class="mt-2 text-2xl font-extrabold text-slate-900">${formatCurrency(inventoryValue, state.settings.moneda)}</h3>
        <p class="text-sm text-slate-500">Base para reporte financiero de existencias.</p>
      </article>
      <article class="view-card">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Inventario potencial</p>
        <h3 class="mt-2 text-2xl font-extrabold text-slate-900">${formatCurrency(inventoryPotential, state.settings.moneda)}</h3>
        <p class="text-sm text-slate-500">Valor estimado al precio de venta.</p>
      </article>
      <article class="view-card">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Producto con mayor stock</p>
        <h3 class="mt-2 text-2xl font-extrabold text-slate-900">${topProduct?.nombre || "Sin datos"}</h3>
        <p class="text-sm text-slate-500">${topProduct ? `Stock actual: ${topProduct.stockActual}` : "No hay productos cargados."}</p>
      </article>
      <article class="view-card">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Última venta</p>
        <h3 class="mt-2 text-2xl font-extrabold text-slate-900">${latestSale ? formatCurrency(latestSale.total, state.settings.moneda) : "Sin ventas"}</h3>
        <p class="text-sm text-slate-500">${latestSale ? `Fecha: ${formatDate(latestSale.fecha)}` : "Aun no hay ventas registradas."}</p>
      </article>
      <article class="view-card md:col-span-2 xl:col-span-3">
        <p class="text-xs uppercase tracking-[0.14em] text-slate-500">Cliente principal</p>
        <h3 class="mt-2 text-2xl font-extrabold text-slate-900">${topCustomer?.nombre || "Sin clientes"}</h3>
        <p class="text-sm text-slate-500">${topCustomer ? `${topCustomer.documento} · ${topCustomer.telefono}` : "Registra clientes para ver analitica comercial."}</p>
      </article>
    </section>
  `;
}
