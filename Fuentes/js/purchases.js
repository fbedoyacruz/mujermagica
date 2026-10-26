import { formatCurrency, formatDate } from "./utils.js";

export function renderPurchases(state) {
  const rows = state.purchases
    .map((item) => {
      return `
        <tr class="border-b border-slate-100 text-sm">
          <td class="px-3 py-3">${item.id}</td>
          <td class="px-3 py-3">${formatDate(item.fecha)}</td>
          <td class="px-3 py-3">${item.proveedorId}</td>
          <td class="px-3 py-3">${item.items.length}</td>
          <td class="px-3 py-3">${formatCurrency(item.total, state.settings.moneda)}</td>
          <td class="px-3 py-3">${item.observaciones}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="view-card">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h3 class="font-heading text-lg font-bold text-slate-900">Compras</h3>
          <p class="text-sm text-slate-500">Modulo base para registrar abastecimiento y aumentar stock.</p>
        </div>
        <button class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Registrar compra</button>
      </div>
      <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table class="min-w-full">
          <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th class="px-3 py-3">Documento</th>
              <th class="px-3 py-3">Fecha</th>
              <th class="px-3 py-3">Proveedor</th>
              <th class="px-3 py-3">Items</th>
              <th class="px-3 py-3">Total</th>
              <th class="px-3 py-3">Observacion</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}
