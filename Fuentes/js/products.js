import { formatCurrency } from "./utils.js";

export function renderProducts(state, searchTerm = "") {
  const criteria = searchTerm.toLowerCase().trim();
  const rows = state.products
    .filter((item) => {
      if (!criteria) return true;
      const text = `${item.nombre} ${item.sku} ${item.marca}`.toLowerCase();
      return text.includes(criteria);
    })
    .map((item) => {
      const pctDetal = Number(item.pctDetal || 0);
      const pctXMayor = Number(item.pctXMayor || 0);

      return `
        <tr class="border-b border-slate-100 text-sm">
          <td class="px-3 py-3">${item.marca || "---"}</td>
          <td class="px-3 py-3">
            <p class="font-semibold text-slate-800">${item.nombre}</p>
            <p class="text-xs text-slate-500">${item.sku}</p>
          </td>
          <td class="px-3 py-3">${formatCurrency(item.vrInicial, state.settings.moneda)}</td>
          <td class="px-3 py-3">${formatCurrency(item.vrXMayor, state.settings.moneda)}</td>
          <td class="px-3 py-3">${formatCurrency(item.vrVenta, state.settings.moneda)}</td>
          <td class="px-3 py-3">${formatCurrency(item.gananciaCliente, state.settings.moneda)}</td>
          <td class="px-3 py-3">${formatCurrency(item.gananciaXMayor, state.settings.moneda)}</td>
          <td class="px-3 py-3">${formatCurrency(item.gananciaDetal, state.settings.moneda)}</td>
          <td class="px-3 py-3">${pctDetal.toFixed(2)}%</td>
          <td class="px-3 py-3">${pctXMayor.toFixed(2)}%</td>
          <td class="px-3 py-3 text-right">
            <button type="button" class="btn-product-edit rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50" data-id="${item.id}">Editar</button>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="view-card">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="font-heading text-lg font-bold text-slate-900">Catalogo de productos</h3>
          <p class="text-sm text-slate-500">Catalogo cargado desde hoja PRODUCTOS (${state.products.length} items).</p>
        </div>
        <div class="flex gap-2">
          <button class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Importar</button>
          <button type="button" class="btn-product-create rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Nuevo producto</button>
        </div>
      </div>
      <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table class="min-w-full">
          <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th class="px-3 py-3">Marca</th>
              <th class="px-3 py-3">Producto</th>
              <th class="px-3 py-3">VR. Inicial</th>
              <th class="px-3 py-3">VR. X Mayor</th>
              <th class="px-3 py-3">VR. Venta</th>
              <th class="px-3 py-3">Ganancia Cliente</th>
              <th class="px-3 py-3">Ganancia X Mayor</th>
              <th class="px-3 py-3">Ganancia Detal</th>
              <th class="px-3 py-3">% Detal</th>
              <th class="px-3 py-3">% X Mayor</th>
              <th class="px-3 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="11" class="px-3 py-6 text-center text-sm text-slate-500">Sin coincidencias para la busqueda.</td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;
}
