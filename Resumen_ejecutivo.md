# Resumen Ejecutivo - MVP Sistema Inventario + POS (Belleza)

## Vision del producto
Construiremos un MVP web profesional de Inventario + POS para productos capilares y maquillaje, orientado a controlar todo el ciclo operativo:

Proveedor -> Compra -> Ingreso inventario -> Actualizacion de existencias -> Venta POS -> Descuento de inventario -> Historial y Kardex.

La aplicacion funcionara abriendo un unico archivo index.html, sin backend, sin Node y sin base de datos real. Toda la informacion se manejara en memoria con objetos y arreglos JavaScript.

## Objetivo de negocio
Entregar una base realista y escalable para evolucionar posteriormente a una version empresarial con backend, autenticacion, base de datos y despliegue cloud.

El MVP debe:
- Dar control operativo diario sobre compras, stock y ventas.
- Reducir quiebres de inventario con alertas visuales y minimos configurables.
- Entregar trazabilidad de movimientos por producto (historial y kardex).
- Soportar facturacion visual profesional para venta al cliente.
- Facilitar decisiones con dashboard y reportes clave.

## Alcance funcional del MVP
### 1) Dashboard ejecutivo
- KPIs principales: total productos, total vendidos, ventas del dia, valor inventario, utilidad estimada.
- Alertas: productos agotandose y sin stock.
- Top vendidos.
- Graficos de ventas, inventario y categorias.

### 2) Inventario de productos
- Catalogo completo con 10 productos iniciales.
- CRUD: crear, editar, eliminar, duplicar, ver detalle.
- Busqueda en tiempo real, filtros, ordenamiento y paginacion.
- Campos completos por producto: precios, IVA, costos, SKU, codigo de barras simulado, stock min/max, ubicacion, estado activo.
- Gestion de imagen por producto.

### 3) Maestros del sistema
- Marcas: listado inicial y alta de nuevas marcas.
- Proveedores: datos de contacto y productos suministrados.
- Clientes: datos de identificacion y contacto.

### 4) Compras
- Registro de compras por proveedor con productos, cantidad, costo, IVA y observaciones.
- Impacto automatico en stock.
- Registro en historial de movimientos.

### 5) Ventas tipo POS
- Busqueda y agregado rapido al carrito.
- Escaneo de codigo simulado.
- Modificacion de cantidades, descuentos e IVA.
- Cobro y generacion de factura.
- Descuento automatico de inventario.
- Registro en historial.

### 6) Facturacion
- Factura visual elegante con empresa, cliente, items, subtotal, IVA, total y metodo de pago.
- QR simulado.
- Boton imprimir y boton descarga PDF simulada.

### 7) Historial y Kardex
- Historial global de movimientos: compra, venta, ajuste con fecha/hora, usuario, proveedor/cliente.
- Kardex por producto: entradas, salidas, existencias, costo promedio, fecha y documento asociado.

### 8) Configuracion
- Parametros editables: IVA, stock min/max, moneda, nombre empresa, logo, colores, tema claro/oscuro.
- Umbrales de colorimetria de stock configurables.

### 9) Reporteria
- Reportes de ventas, compras, inventario, agotados, top vendidos, valor inventario, utilidades, clientes y proveedores.

## Experiencia de usuario y diseno
Se implementara una interfaz moderna estilo SaaS, inspirada en referentes premium (Apple, Stripe, Linear, Notion), sin copiar interfaces.

Lineamientos UX/UI:
- Sidebar de navegacion por modulos.
- Cards de metricas y paneles con jerarquia visual clara.
- Gradientes suaves, sombras limpias, bordes redondeados y transiciones fluidas.
- Componentes de feedback: toasts, modales, tooltips, badges, loaders y skeleton loading.
- Breadcrumbs, tabs y atajos de teclado para velocidad operativa.
- Totalmente responsive para desktop y mobile.

## Arquitectura tecnica (sin frameworks)
Estructura modular propuesta:

- index.html
- css/styles.css
- js/database.js
- js/products.js
- js/providers.js
- js/customers.js
- js/inventory.js
- js/purchases.js
- js/sales.js
- js/dashboard.js
- js/invoice.js
- js/reports.js
- js/utils.js
- js/app.js

Principios de implementacion:
- Separacion de responsabilidades por modulo.
- Estado central en memoria en database.js.
- Servicios por dominio (productos, ventas, compras, etc.).
- Renderizado desacoplado de la logica de negocio.
- Eventos de UI centralizados para minimizar acoplamiento.
- Convenciones y codigo limpio para futura migracion a backend.

## Modelo de datos en memoria
El estado se organizara en colecciones:
- products
- brands
- providers
- customers
- purchases
- sales
- inventoryMovements
- invoices
- settings

Reglas clave:
- Compra suma stock y recalcula costo promedio.
- Venta resta stock y calcula total con IVA/descuento.
- Cada operacion genera movimiento trazable.
- Los KPI se derivan del estado actual y del historial.

## Plan de trabajo por fases (con aprobacion)
### Fase 1 - Base del sistema
- Estructura de carpetas y archivos.
- Base de datos en memoria con datos iniciales.
- Sistema de rutas internas por vistas (SPA simple sin framework).
- Layout principal responsive (sidebar, topbar, area de contenido).

Entregable: aplicacion base navegable con tema visual inicial.

### Fase 2 - Inventario y maestros
- Modulos: productos, marcas, proveedores, clientes.
- CRUD, filtros, busqueda, ordenamiento, paginacion.
- Carga y vista de imagenes de producto.

Entregable: gestion operativa de catalogo completa.

### Fase 3 - Compras, POS y facturacion
- Flujo de compras con impacto en stock.
- POS con carrito, descuentos, IVA y cobro.
- Factura visual con impresion y PDF simulado.

Entregable: ciclo operativo compra-venta funcional.

### Fase 4 - Trazabilidad, dashboard y reportes
- Historial global y kardex por producto.
- Dashboard con KPIs y graficos.
- Reportes principales por dominio.

Entregable: control analitico y trazabilidad total.

### Fase 5 - Pulido UX y configuracion avanzada
- Colorimetria configurable de stock.
- Panel de configuracion integral.
- Mejoras finales de experiencia, accesibilidad y rendimiento.

Entregable: MVP profesional listo para evolucion empresarial.

## Criterios de exito del MVP
- Flujo completo compra -> inventario -> venta funcionando sin errores.
- Actualizacion automatica de stock en cada operacion.
- Trazabilidad verificable por historial y kardex.
- Interfaz moderna, rapida y responsive.
- Codigo organizado y mantenible para migracion futura.
