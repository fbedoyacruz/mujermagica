export function renderProviders(state, searchTerm = "") {
  const criteria = searchTerm.toLowerCase();
  const cards = state.providers
    .filter((item) => {
      if (!criteria) return true;
      return `${item.nombre} ${item.ciudad} ${item.contacto}`.toLowerCase().includes(criteria);
    })
    .map((item) => {
      return `
        <article class="rounded-2xl border border-slate-200 bg-white p-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h4 class="font-heading text-base font-bold text-slate-900">${item.nombre}</h4>
              <p class="mt-1 text-sm text-slate-500">Contacto: ${item.contacto}</p>
            </div>
            <button type="button" class="btn-provider-edit rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50" data-id="${item.id}">Editar</button>
          </div>
          <p class="text-sm text-slate-500">Ciudad: ${item.ciudad}</p>
          <p class="text-sm text-slate-500">Telefono: ${item.telefono}</p>
          <p class="text-sm text-slate-500">Correo: ${item.correo}</p>
          <p class="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Productos</p>
          <div class="mt-2 flex flex-wrap gap-2">
            ${item.productos.map((product) => `<span class="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">${product}</span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");

  return `
    <section class="view-card">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h3 class="font-heading text-lg font-bold text-slate-900">Proveedores</h3>
          <p class="text-sm text-slate-500">Base maestra para flujo de compras y abastecimiento.</p>
        </div>
        <button type="button" class="btn-provider-create rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Nuevo proveedor</button>
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">${cards || `<p class="text-sm text-slate-500">No se encontraron proveedores.</p>`}</div>
    </section>
  `;
}
