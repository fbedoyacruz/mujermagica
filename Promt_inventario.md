# SUPER PROMPT - Sistema Web de Gestión de Inventario (POS + Inventario) para Productos de Belleza

Actúa como un **Software Architect**, **Senior Full Stack Developer**, **UX/UI Designer**, **Product Owner**, **Experto en Sistemas POS**, **Especialista en Gestión de Inventarios** y **Consultor de Negocios**.

Tu misión es desarrollar un **prototipo web completamente funcional (MVP)** de un sistema moderno de inventario y punto de venta (POS) inspirado en soluciones como:

* Zoho Inventory
* Odoo Inventory
* Square Inventory
* Siesa
* Alegra
* Siigo

No copies el diseño de ninguno, sino crea una interfaz moderna, elegante, intuitiva y rápida.

---

# Objetivo

Construir un sistema para una empresa dedicada a la venta de productos capilares y maquillaje, permitiendo controlar completamente el flujo del inventario desde la compra al proveedor hasta la venta al cliente.

El sistema debe permitir rastrear todo el ciclo de vida de un producto.

Proveedor
↓

Compra
↓

Ingreso al inventario
↓

Actualización de existencias
↓

Venta
↓

Descuento automático del inventario
↓

Historial de movimientos

---

# Tecnologías

Crear el proyecto utilizando únicamente:

* HTML5
* CSS moderno
* Tailwind CSS (CDN)
* JavaScript ES2023
* Sin frameworks
* Sin backend
* Base de datos en memoria (Arrays y Objetos JavaScript)

Toda la aplicación debe funcionar únicamente abriendo index.html.

No utilizar Node.

No utilizar Docker.

No utilizar bases de datos reales.

Todo debe simularse mediante una base de datos en memoria.

---

# Diseño

El diseño debe ser extremadamente moderno.

Inspirado en:

* Apple
* Stripe
* Linear
* Notion
* Odoo
* Zoho

Debe verse como un software SaaS profesional.

Utilizar:

* Cards
* Gradientes suaves
* Sombras modernas
* Bordes redondeados
* Animaciones suaves
* Dashboard profesional
* Responsive
* Iconos (Heroicons o FontAwesome)

Debe sentirse como un software comercial listo para vender.

---

# Productos iniciales

Inicializar el sistema con 10 productos.

1. Shampoo
2. Acondicionador
3. Mantequilla Capilar
4. Crema para Cabello
5. Perfume Capilar
6. Sombras
7. Brillos
8. Repolarizador
9. Brochas
10. Polvo Compacto

Cada producto debe contener:

* id
* nombre
* descripción
* categoría
* marca
* proveedor
* imagen
* SKU
* código de barras (simulado)
* precio de compra
* precio venta mayorista
* precio venta detal
* costo promedio
* utilidad
* IVA
* stock actual
* stock mínimo
* stock máximo
* ubicación
* fecha ingreso
* fecha última compra
* activo/inactivo

Agregar imágenes ilustrativas para cada producto.

---

# Marcas

Agregar varias marcas.

Por ejemplo:

* CABA
* Angelous
* Milagros
* Poción
* Salvatore
* Kativa
* Alfaparf
* L'Oréal
* Schwarzkopf
* Wella

Debe poder agregarse nuevas marcas.

---

# Proveedores

Crear módulo de proveedores.

Cada proveedor tendrá:

* Nombre
* Teléfono
* Correo
* Dirección
* Ciudad
* Contacto
* Productos que suministra

---

# Clientes

Crear módulo de clientes.

Debe almacenar:

* Nombre
* Documento
* Teléfono
* Correo
* Dirección

---

# Dashboard

Al iniciar mostrar un Dashboard con indicadores.

Total productos

Total vendidos

Ventas del día

Valor del inventario

Utilidad estimada

Productos agotándose

Productos sin stock

Productos más vendidos

Gráfico de ventas

Gráfico de inventario

Gráfico por categorías

---

# Inventario

Permitir:

Agregar productos

Editar

Eliminar

Buscar

Filtrar

Ordenar

Duplicar

Ver detalle

Subir imagen

Cambiar precio

Cambiar proveedor

Cambiar marca

Mover ubicación

---

# Filtros

Debe poder filtrar por:

Marca

Proveedor

Categoría

Precio

Stock

Fecha

Nombre

SKU

---

# Compras

Crear módulo de compras.

Registrar:

Proveedor

Productos

Cantidad

Costo

IVA

Fecha

Observaciones

Al guardar una compra el stock aumenta automáticamente.

Debe quedar registrado en el historial.

---

# Ventas (POS)

Crear un módulo tipo POS.

Debe permitir:

Buscar producto

Escanear código (simulado)

Agregar al carrito

Modificar cantidad

Aplicar descuento

Calcular IVA

Eliminar producto

Cobrar

Generar factura

Actualizar automáticamente el inventario.

---

# Facturación

Generar una factura elegante.

Debe incluir:

Logo

Empresa

Cliente

Fecha

Número factura

Productos

Cantidad

Precio

Subtotal

IVA

Total

Método de pago

Código QR (simulado)

Botón imprimir

Botón descargar PDF (simulado)

---

# Historial

Guardar movimientos del inventario.

Registrar:

Fecha

Hora

Usuario

Tipo movimiento

Compra

Venta

Ajuste

Cantidad

Producto

Proveedor

Cliente

---

# Kardex

Cada producto debe tener su propio Kardex.

Mostrar:

Entradas

Salidas

Existencias

Costo promedio

Fecha

Documento asociado

---

# Colorimetría del Stock

Implementar un sistema visual de colores.

Configurable por parámetros.

Ejemplo:

🟢 Verde

Más de 20 unidades.

🟡 Amarillo

Entre 10 y 20.

🟠 Naranja

Entre 5 y 9.

🔴 Rojo

Menos de 5.

⚫ Gris

Sin existencias.

Los valores deben poder modificarse desde configuración.

---

# Configuración

Crear un panel de configuración donde el usuario pueda cambiar:

IVA

Stock mínimo

Stock máximo

Moneda

Nombre empresa

Logo

Color principal

Color secundario

Tema claro

Tema oscuro

---

# Reportes

Crear reportes de:

Ventas

Compras

Inventario

Productos agotados

Productos más vendidos

Valor del inventario

Utilidades

Clientes

Proveedores

---

# Búsquedas

Todas las tablas deben tener:

Búsqueda en tiempo real

Paginación

Ordenamiento

Filtros

---

# Experiencia de Usuario

Agregar:

Toast Notifications

Modales

Confirmaciones

Tooltips

Loader

Animaciones

Skeleton Loading

Badges

Tabs

Sidebar

Breadcrumbs

Atajos de teclado

---

# Datos en memoria

Toda la información debe almacenarse en memoria utilizando objetos JavaScript.

No usar LocalStorage por ahora.

Todo debe inicializarse con datos de ejemplo.

---

# Arquitectura

Organizar el código en módulos.

index.html

css/

styles.css

js/

database.js

products.js

providers.js

customers.js

inventory.js

purchases.js

sales.js

dashboard.js

invoice.js

reports.js

utils.js

app.js

El código debe ser limpio, desacoplado, reutilizable y fácil de migrar posteriormente a un backend con Java Spring Boot o Node.js.

---

# Calidad del código

Aplicar buenas prácticas de ingeniería:

* SOLID
* Clean Code
* Componentización
* Separación de responsabilidades
* Código reutilizable
* Funciones pequeñas
* Comentarios claros
* Convenciones consistentes

---

# Objetivo final

Quiero un prototipo tan completo y profesional que pueda servir como base para evolucionarlo posteriormente hacia un sistema empresarial real con backend, autenticación, base de datos y despliegue en la nube. Debe transmitir la sensación de estar utilizando un software comercial moderno, intuitivo, rápido y visualmente atractivo.

No comenzar a escribir código todavía. Primero quiero que me hagas un **resumen ejecutivo** de todo lo que vamos a construir, incluyendo la arquitectura, los módulos, las funcionalidades y la experiencia de usuario. Luego, una vez aprobado el resumen, comenzaremos a desarrollar el prototipo paso a paso, basado en el resumen y promt que hemos definido. Pensaría que es buena idea dividir el desarrollo en fases, comenzando con la arquitectura y los módulos principales, luego avanzando hacia las funcionalidades específicas y finalmente refinando la experiencia de usuario y el diseño visual, asegurando que todo esté alineado con las mejores prácticas de desarrollo y diseño de software moderno, me vas solicitando aprobación para cada fase antes de continuar con la siguiente.