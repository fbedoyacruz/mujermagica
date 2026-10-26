export function formatCurrency(value, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function formatDate(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(date);
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function stockVisual(stock, rules) {
  if (stock <= 0) {
    return { label: "Sin stock", className: "bg-slate-200 text-slate-700" };
  }
  if (stock < rules.red.max) {
    return { label: "Critico", className: "bg-red-100 text-red-700" };
  }
  if (stock <= rules.orange.max) {
    return { label: "Bajo", className: "bg-orange-100 text-orange-700" };
  }
  if (stock <= rules.yellow.max) {
    return { label: "Medio", className: "bg-amber-100 text-amber-700" };
  }
  return { label: "Optimo", className: "bg-emerald-100 text-emerald-700" };
}

export function showToast(message, type = "info") {
  const host = document.getElementById("toastHost");
  if (!host) return;

  const palette = {
    info: "bg-slate-900",
    success: "bg-emerald-700",
    warning: "bg-amber-700",
    danger: "bg-red-700"
  };

  const el = document.createElement("div");
  el.className = `toast-item ${palette[type] || palette.info}`;
  el.textContent = message;

  host.appendChild(el);
  window.setTimeout(() => el.remove(), 2600);
}

export function computeInventoryValue(products) {
  return products.reduce((sum, item) => sum + item.stockActual * item.costoPromedio, 0);
}

export function computeEstimatedProfit(products) {
  return products.reduce((sum, item) => {
    return sum + (item.precioVentaDetal - item.costoPromedio) * item.stockActual;
  }, 0);
}
