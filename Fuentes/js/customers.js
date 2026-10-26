export function renderCustomers(state, searchTerm = "") {
  const criteria = searchTerm.toLowerCase();
  const rows = state.customers
    .filter((item) => {
      if (!criteria) return true;
      return `${item.nombre} ${item.documento} ${item.telefono}`.toLowerCase().includes(criteria);
    })
    .map((item) => {
      return `
        <tr class="border-b border-slate-100 text-sm">
          <td class="px-3 py-3 font-semibold text-slate-800">${item.nombre}</td>
          <td class="px-3 py-3">${item.documento}</td>
          <td class="px-3 py-3">${item.telefono}</td>
          <td class="px-3 py-3">${item.correo}</td>
          <td class="px-3 py-3">${item.direccion}</td>
          <td class="px-3 py-3 text-right">
            <button type="button" class="btn-customer-edit rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50" data-id="${item.id}">Editar</button>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="view-card">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h3 class="font-heading text-lg font-bold text-slate-900">Clientes</h3>
          <p class="text-sm text-slate-500">Registro comercial para ventas, facturacion y fidelizacion.</p>
        </div>
        <button type="button" class="btn-customer-create rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Nuevo cliente</button>
      </div>
      <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table class="min-w-full">
          <thead class="bg-slate-50 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th class="px-3 py-3">Nombre</th>
              <th class="px-3 py-3">Documento</th>
              <th class="px-3 py-3">Telefono</th>
              <th class="px-3 py-3">Correo</th>
              <th class="px-3 py-3">Direccion</th>
              <th class="px-3 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="6" class="px-3 py-5 text-center text-sm text-slate-500">Sin resultados.</td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;
}
