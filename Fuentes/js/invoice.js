import { formatCurrency } from "./utils.js";

export function renderInvoice(state) {
  const sale = state.sales[0];
  const invoice = state.invoices[0];

  return `
    <section class="view-card">
      <div class="rounded-2xl border border-slate-200 bg-white p-5">
        <div class="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Factura</p>
            <h3 class="font-heading text-xl font-bold text-slate-900">${invoice.id}</h3>
          </div>
          <div class="text-sm text-slate-500">
            <p>Empresa: ${state.settings.nombreEmpresa}</p>
            <p>Metodo pago: ${sale.metodoPago}</p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="rounded-xl bg-slate-50 p-3">
            <p class="text-xs uppercase tracking-[0.12em] text-slate-500">Cliente</p>
            <p class="font-semibold text-slate-800">${sale.clienteId}</p>
          </div>
          <div class="rounded-xl bg-slate-50 p-3">
            <p class="text-xs uppercase tracking-[0.12em] text-slate-500">QR</p>
            <p class="font-semibold text-slate-800">${invoice.qrCode}</p>
          </div>
        </div>

        <div class="mt-4 rounded-xl border border-slate-200">
          <div class="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-sm">
            <span>Subtotal</span>
            <strong>${formatCurrency(sale.subtotal, state.settings.moneda)}</strong>
          </div>
          <div class="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-sm">
            <span>IVA</span>
            <strong>${formatCurrency(sale.iva, state.settings.moneda)}</strong>
          </div>
          <div class="flex items-center justify-between px-3 py-2 text-sm">
            <span>Total</span>
            <strong>${formatCurrency(sale.total, state.settings.moneda)}</strong>
          </div>
        </div>

        <div class="mt-4 flex gap-2">
          <button class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Imprimir</button>
          <button class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Descargar PDF</button>
        </div>
      </div>
    </section>
  `;
}
