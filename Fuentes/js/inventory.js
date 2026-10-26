import { formatCurrency, stockVisual } from "./utils.js";

export function renderInventory(state, searchTerm = "") {
  const criteria = searchTerm.toLowerCase();
  const items = state.products.filter((item) => {
    if (!criteria) return true;
    return `${item.nombre} ${item.ubicacion} ${item.categoria}`.toLowerCase().includes(criteria);
  });

  const cards = items
    .map((item) => {
      const stock = stockVisual(item.stockActual, {
        red: { max: state.settings.stockRules.red.max },
        orange: { max: state.settings.stockRules.orange.max },
        yellow: { max: state.settings.stockRules.yellow.max }
      });

      return `
        <article class="rounded-2xl border border-slate-200 bg-white p-4">
          <div class="flex items-center justify-between">
            <h4 class="font-semibold text-slate-900">${item.nombre}</h4>
            <span class="stock-badge ${stock.className}">${stock.label}</span>
          </div>
          <p class="mt-2 text-sm text-slate-500">Ubicacion: ${item.ubicacion}</p>
          <p class="text-sm text-slate-500">Stock actual: ${item.stockActual} unidades</p>
          <p class="text-sm text-slate-500">Costo promedio: ${formatCurrency(item.costoPromedio, state.settings.moneda)}</p>
          <p class="text-xs text-slate-400">Min: ${item.stockMinimo} | Max: ${item.stockMaximo}</p>
        </article>
      `;
    })
    .join("");

  return `
    <section class="view-card">
      <div class="mb-4">
        <h3 class="font-heading text-lg font-bold text-slate-900">Control de inventario</h3>
        <p class="text-sm text-slate-500">Vista rapida de existencias, ubicaciones y niveles de stock.</p>
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">${cards || `<p class="text-sm text-slate-500">No hay productos para mostrar.</p>`}</div>
    </section>
  `;
}
