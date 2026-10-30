# Backend Node/MySQL – Prototipo Mujer Magica

Backend liviano (Express + MySQL) que reemplaza el `localStorage` del prototipo
`Fuentes/sistema-completo.html` por almacenamiento real en el esquema MySQL
`mujermagicabd`.

> Este backend es independiente del prototipo Spring Boot + Angular en
> `prototipo_ia_back_front/`, que se mantiene intacto para una futura versión.

## Requisitos

- Node.js 18+
- MySQL corriendo localmente, con el esquema `mujermagicabd` ya creado (vacío o no).

## Configuración

1. Copia `.env.example` a `.env` y ajusta usuario/contraseña de MySQL si es necesario:
   ```
   copy .env.example .env
   ```
2. Instala dependencias:
   ```
   npm install
   ```
3. Inicia el servidor (crea las tablas automáticamente si no existen):
   ```
   npm start
   ```
   Quedará escuchando en `http://localhost:4000`.

## Endpoints

- `GET /api/state` – devuelve todo el estado (productos, servicios, proveedores, clientes, ventas, compras, movimientos).
- `PUT /api/state` – reemplaza todo el estado (lo usa `saveDB()` del frontend en cada cambio).
- `POST /api/migrate` – recibe el JSON de un respaldo de `localStorage`/`exportDatabase()` y lo carga en MySQL (mismo formato que `/api/state`).

## Uso con el prototipo

Abre `Fuentes/sistema-completo.html` en el navegador con el backend corriendo.
Al iniciar:

- Si MySQL ya tiene productos, se cargan desde ahí.
- Si no tiene datos pero el navegador tiene un respaldo en `localStorage` (clave `mujermagicaDB`), se ofrecerá migrarlo automáticamente.
- Si no hay nada en ningún lado, se siembra con los datos de demostración y se guardan en MySQL.

Cada cambio (crear/editar producto, proveedor, cliente, confirmar venta, etc.) se sincroniza contra `PUT /api/state`, por lo que puedes verificar los datos directamente en MySQL Workbench sobre el esquema `mujermagicabd`.

## Autorizacion para eliminar ventas

- Configura `SALE_DELETE_AUTH_CODE` en el archivo `.env` del backend y reinicia
   el servidor. Usa un codigo privado de letras y numeros (hasta 128 caracteres);
   se recomienda uno aleatorio de al menos 12 caracteres. Distingue mayusculas
   de minusculas. No compartas el codigo en el chat ni lo incluyas en Git.
- No existe un codigo predeterminado: mientras no se configure, la API bloquea
   las eliminaciones de ventas, pero permite los guardados normales.
- En **Historial de ventas > Eliminar**, el modal solicita el codigo en un campo
   oculto. Cancelar no modifica datos. Si la autorizacion falla, la venta y el
   stock se conservan; el campo se limpia para reintentar.
- El codigo se envia temporalmente en la cabecera `X-Sale-Delete-Code`; no se
   incluye en snapshots, respaldos ni almacenamiento del navegador.
- La API protege tanto `PUT /api/state` como `POST /api/migrate` si el nuevo
   estado omite ventas existentes. Una importacion que quite ventas tambien
   requiere esa cabecera; la importacion actual de la interfaz no la solicita.
- Este mecanismo no sustituye un sistema de usuarios. Mantiene el backend en
   un entorno local de confianza; para acceso remoto, usa HTTPS y autenticacion.

## Servicios personalizados

Reinicia el backend con `npm start` y recarga el HTML al actualizar esta version.
El inicio crea `services` y `sale_service_items` si no existen, y agrega los
procedimientos iniciales faltantes sin sustituir el catalogo ni las ventas
anteriores: Alisado, Terapia capilar, Hidratacion, Henna y Lifting de pestanas.

- En **Servicios > Catalogo**, registra procedimientos nuevos, edita su nombre,
   precio/costo sugerido y estado.
   Desactivar un procedimiento lo oculta del POS, pero conserva su historial.
- En **POS > Servicios**, selecciona un procedimiento de la lista, escribe el
   valor acordado y agrega costo directo u observaciones opcionales. Puedes
   combinar servicios y productos en una factura.
- Cada servicio cobrado guarda su nombre, precio, costo y observaciones en la
   venta. Los cambios posteriores al catalogo no alteran esos datos.
- La pestaña **Servicios > Historial de realizados** presenta cada procedimiento
   cobrado, cliente, valor, observaciones y acceso a su factura. El historial se
   genera a partir de las ventas; no duplica ni requiere volver a capturar datos.
- Los servicios no descuentan stock ni aumentan la inversion en productos.
- Los reportes mensuales separan ingresos por productos y servicios. Un costo
   vacio significa desconocido, no cero: esa ganancia se excluye del indicador
   de ganancia conocida. Un costo cero explicito si participa en el calculo.

## Pruebas

Desde esta carpeta, ejecuta `npm test` (Node.js 18 o posterior). Las pruebas usan
datos aislados y no escriben en MySQL. Cubren ventas mixtas, precio historico,
stock, costos desconocidos y persistencia mediante consultas simuladas.
