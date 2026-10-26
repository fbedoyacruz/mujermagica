import { uid } from "./utils.js";
import { excelProductsSeed } from "./products-from-excel.js";

const today = new Date().toISOString();

const defaultStockRules = {
  green: { min: 21 },
  yellow: { min: 10, max: 20 },
  orange: { min: 5, max: 9 },
  red: { min: 1, max: 4 },
  gray: { value: 0 }
};

const brands = [
  "CABA",
  "Angelous",
  "Milagros",
  "Pocion",
  "Salvatore",
  "Kativa",
  "Alfaparf",
  "Loreal",
  "Schwarzkopf",
  "Wella"
];

const providers = [
  {
    id: "prov_001",
    nombre: "Distribuciones CABA",
    telefono: "3001002000",
    correo: "compras@caba.co",
    direccion: "Cra 12 #45-20",
    ciudad: "Medellin",
    contacto: "Laura Casta",
    productos: ["Shampoo", "Acondicionador", "Perfume Capilar"]
  },
  {
    id: "prov_002",
    nombre: "Belleza Profesional SAS",
    telefono: "3016677889",
    correo: "ventas@bellezapro.co",
    direccion: "Calle 8 #32-10",
    ciudad: "Bogota",
    contacto: "Javier Ruiz",
    productos: ["Sombras", "Brochas", "Polvo Compacto", "Brillos"]
  },
  {
    id: "prov_003",
    nombre: "Cosmeticos del Norte",
    telefono: "3028899001",
    correo: "suministros@cosnorte.co",
    direccion: "Av 4N #19-50",
    ciudad: "Cali",
    contacto: "Paola Nieto",
    productos: ["Repolarizador", "Mantequilla Capilar", "Crema para Cabello"]
  }
];

const customers = [
  {
    id: "cli_001",
    nombre: "Mariana Gil",
    documento: "1023456789",
    telefono: "3114456677",
    correo: "mariana.gil@email.com",
    direccion: "Cra 70 #22-15"
  },
  {
    id: "cli_002",
    nombre: "Diana Toro",
    documento: "52999887",
    telefono: "3129987744",
    correo: "diana.toro@email.com",
    direccion: "Calle 10 #14-22"
  }
];

function buildProduct(index, data) {
  const providerFallback = providers[0]?.nombre || "Sin proveedor";

  return {
    id: data.id || `prod_${String(index + 1).padStart(3, "0")}`,
    nombre: data.nombre,
    descripcion: data.nombre,
    categoria: "General",
    marca: data.marca,
    proveedor: providerFallback,
    imagen: "images/shampoo_cebolla.jpg",
    sku: data.sku || `MM-${String(index + 1).padStart(4, "0")}`,
    codigoBarras: `77000${String(index + 1).padStart(8, "0")}`,
    precioCompra: data.vrInicial,
    precioVentaMayorista: data.vrXMayor,
    precioVentaDetal: data.vrVenta,
    costoPromedio: data.vrInicial,
    utilidad: data.gananciaDetal,
    iva: 19,
    stockActual: 0,
    stockMinimo: 8,
    stockMaximo: 80,
    ubicacion: "SIN-UBICACION",
    fechaIngreso: today,
    fechaUltimaCompra: today,
    activo: true,
    vrInicial: data.vrInicial,
    vrXMayor: data.vrXMayor,
    vrVenta: data.vrVenta,
    gananciaCliente: data.gananciaCliente,
    gananciaXMayor: data.gananciaXMayor,
    gananciaDetal: data.gananciaDetal,
    pctDetal: data.pctDetal,
    pctXMayor: data.pctXMayor
  };
}

const products = excelProductsSeed.map((item, index) => buildProduct(index, item));

const sales = [
  {
    id: uid("sale"),
    fecha: today,
    clienteId: "cli_001",
    items: [
      { productId: "prod_001", cantidad: 2, precio: 29000 },
      { productId: "prod_007", cantidad: 1, precio: 22000 }
    ],
    subtotal: 80000,
    iva: 15200,
    descuento: 0,
    total: 95200,
    metodoPago: "Efectivo"
  }
];

const purchases = [
  {
    id: uid("buy"),
    fecha: today,
    proveedorId: "prov_002",
    items: [
      { productId: "prod_006", cantidad: 10, costo: 24000 }
    ],
    iva: 45600,
    total: 285600,
    observaciones: "Compra inicial de maqullaje"
  }
];

const inventoryMovements = [
  {
    id: uid("mov"),
    fecha: today,
    usuario: "Admin",
    tipoMovimiento: "Ajuste",
    cantidad: 24,
    productoId: "prod_001",
    proveedorId: "prov_001",
    clienteId: null,
    documento: "Ajuste inicial"
  },
  {
    id: uid("mov"),
    fecha: today,
    usuario: "Admin",
    tipoMovimiento: "Venta",
    cantidad: -2,
    productoId: "prod_001",
    proveedorId: null,
    clienteId: "cli_001",
    documento: "Factura demo"
  }
];

const invoices = [
  {
    id: "FAC-1001",
    saleId: sales[0].id,
    qrCode: "QR-SIMULADO-1001"
  }
];

export const db = {
  settings: {
    iva: 19,
    stockMinimoGlobal: 8,
    stockMaximoGlobal: 80,
    moneda: "COP",
    nombreEmpresa: "Mujer Magica",
    logo: "MM",
    colorPrincipal: "#f97316",
    colorSecundario: "#14b8a6",
    tema: "claro",
    stockRules: defaultStockRules
  },
  brands,
  providers,
  customers,
  products,
  purchases,
  sales,
  invoices,
  inventoryMovements
};
