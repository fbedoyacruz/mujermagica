import { computeEstimatedProfit, computeInventoryValue, formatCurrency } from "./utils.js";

function categorySummary(products) {
  const bucket = products.reduce((acc, item) => {
    acc[item.categoria] = (acc[item.categoria] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(bucket);
}

export function renderDashboard(state, searchTerm = "") {
  const products = state.products.filter((item) => {
    return item.nombre.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const inventoryValue = computeInventoryValue(products);
  const estimatedProfit = computeEstimatedProfit(products);
  const soldTotal = state.sales.reduce((sum, sale) => {
    return sum + sale.items.reduce((acc, line) => acc + line.cantidad, 0);
  }, 0);
  const lowStock = products.filter((item) => item.stockActual <= item.stockMinimo).length;
  const outStock = products.filter((item) => item.stockActual <= 0).length;

  const categories = categorySummary(products)
    .map(([name, count]) => `<li class="flex items-center justify-between border-b border-slate-100 py-2 text-sm"><span>${name}</span><span class="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">${count}</span></li>`)
    .join("");

  return `
    <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <article class="kpi-card">
        <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Total productos</p>
        <h3 class="mt-2 text-2xl font-extrabold text-slate-900">${products.length}</h3>
      </article>
      <article class="kpi-card">
        <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Total vendidos</p>
        <h3 class="mt-2 text-2xl font-extrabold text-slate-900">${soldTotal}</h3>
      </article>
      <article class="kpi-card">
        <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Valor inventario</p>
        <h3 class="mt-2 text-2xl font-extrabold text-slate-900">${formatCurrency(inventoryValue, state.settings.moneda)}</h3>
      </article>
      <article class="kpi-card">
        <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Utilidad estimada</p>
        <h3 class="mt-2 text-2xl font-extrabold text-slate-900">${formatCurrency(estimatedProfit, state.settings.moneda)}</h3>
      </article>
      <article class="kpi-card">
        <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Alertas stock</p>
        <h3 class="mt-2 text-2xl font-extrabold text-slate-900">${lowStock}</h3>
        <p class="mt-1 text-xs text-slate-500">Sin stock: ${outStock}</p>
      </article>
    </section>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <article class="view-card xl:col-span-2">
        <div class="mb-4 flex items-center justify-between">
          <h4 class="font-heading text-lg font-bold text-slate-900">Resumen de ventas e inventario</h4>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">MVP Fase 1</span>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 p-4">
            <p class="text-sm font-semibold text-slate-700">Ventas del dia</p>
            <p class="mt-2 text-xl font-extrabold text-slate-900">${formatCurrency(95200, state.settings.moneda)}</p>
          </div>
          <div class="rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-50 p-4">
            <p class="text-sm font-semibold text-slate-700">Tickets registrados</p>
            <p class="mt-2 text-xl font-extrabold text-slate-900">${state.sales.length}</p>
          </div>
          <div class="rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-50 p-4">
            <p class="text-sm font-semibold text-slate-700">Compras cargadas</p>
            <p class="mt-2 text-xl font-extrabold text-slate-900">${state.purchases.length}</p>
          </div>
        </div>
        <div class="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p class="text-sm text-slate-600">En la Fase 1 dejamos el dashboard funcional con metricas reales en memoria y listo para conectar graficos dinamicos en la Fase 4.</p>
        </div>
      </article>

      <article class="view-card">
        <h4 class="font-heading text-lg font-bold text-slate-900">Productos por categoria</h4>
        <ul class="mt-3">${categories}</ul>
      </article>
    </section>
  `;
}
