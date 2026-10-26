import { formatCurrency, formatDate } from "./utils.js";

export function renderSales(state) {
  const rows = state.sales
    .map((item) => {
      return `
        <tr class="border-b border-slate-100 text-sm">
          <td class="px-3 py-3">${item.id}</td>
          <td class="px-3 py-3">${formatDate(item.fecha)}</td>
          <td class="px-3 py-3">${item.clienteId || "Cliente contado"}</td>
          <td class="px-3 py-3">${item.items.length}</td>
          <td class="px-3 py-3">${item.descuento}%</td>
          <td class="px-3 py-3 font-semibold text-slate-800">${formatCurrency(item.total, state.settings.moneda)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="view-card">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h3 class="font-heading text-lg font-bold text-slate-900">POS Ventas</h3>
          <p class="text-sm text-slate-500">Base del modulo POS lista para carrito y cobro en Fase 3.</p>
        </div>
        <button class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Nueva venta</button>
      </div>
      <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table class="min-w-full">
          <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th class="px-3 py-3">Ticket</th>
              <th class="px-3 py-3">Fecha</th>
              <th class="px-3 py-3">Cliente</th>
              <th class="px-3 py-3">Items</th>
              <th class="px-3 py-3">Descuento</th>
              <th class="px-3 py-3">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}
