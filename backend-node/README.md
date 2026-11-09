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

## Comprobantes de abonos a creditos por factura

- En **Cartera > Creditos por factura > Registrar abono**, al guardar se abre
   un comprobante independiente con la deuda antes del pago, el valor abonado
   y el saldo pendiente. Incluye cliente, fecha, metodo y factura de origen.
- Usa **Imprimir** para obtener el recibo termico de 58 mm. No incluye IVA,
   retenciones ni netos internos, y no registra una venta adicional.
- En **Historial de abonos > Ver comprobante** puedes volver a imprimirlo.
   Los nuevos abonos conservan sus saldos originales aunque se registren
   pagos posteriores. Para abonos antiguos sin esos datos, se reconstruyen
   los saldos segun su historial cronologico.
- Reinicia el backend y recarga la pagina despues de actualizar: el inicio
   agrega automaticamente `saldo_anterior` y `saldo_posterior` a
   `customer_payments`, sin borrar los pagos existentes.

## Cartera antigua

- En **Punto de Venta > Cartera antigua**, selecciona un cliente registrado.
   En su primer abono ingresa el saldo de la deuda anterior al sistema,
   el abono recibido y una observacion opcional.
- Agrega el abono al carrito y confirma el cobro. La deuda se registra solo
   cuando se guarda correctamente; cancelar o retirar el abono no crea deuda.
- En los siguientes abonos se carga el saldo pendiente del mismo cliente.
   No se permite pagar mas que el saldo ni registrar el abono como venta a credito.
- El cliente queda seleccionado para el comprobante. Se pueden incluir
   productos y servicios del mismo cliente en el carrito; solo los productos
   descuentan existencias. Los recargos del medio de pago no reducen la deuda.
- La factura y el recibo termico incluyen saldo anterior, abono, saldo restante
   y observacion. **Cartera** muestra tambien las deudas antiguas por cliente.
- Los abonos se suman al ingreso del dia y del mes, separados en reportes
   de productos y servicios; el capital recuperado no se cuenta como ganancia.
- Anular el cobro exige el codigo de autorizacion existente y repone el saldo
   abonado sin mover inventario por ese concepto.
- Reinicia el backend despues de actualizar: se crean las tablas
   `legacy_debts` y `sale_legacy_payments` sin modificar ventas anteriores.

## Respaldo SQL diario a las 18:00

El respaldo se guarda en `Fuentes/backup diario`, con fecha, hora y nombre
unico. Incluye la estructura y los datos de MySQL, triggers, rutinas y eventos;
no incluye imagenes de productos ni otros archivos del proyecto.
No ejecuta restauraciones, no cambia tablas y no borra respaldos anteriores.

1. Se requiere `mysqldump` y la configuracion MySQL del archivo `.env` del
   backend. Se detecta MySQL Server 8.0 en su ruta habitual de Windows. Para
   otra instalacion, configura `MYSQLDUMP_PATH` con la ruta del ejecutable,
   sin incluir comillas como parte del valor.
2. Desde PowerShell, en la raiz del proyecto, registra la tarea:
   ```powershell
   & .\backend-node\register-daily-backup.ps1
   ```
   Se crea `MujerMagica-BackupDiario-1800` para las 6:00 p. m. segun la hora
   local de Windows, con permisos normales y la sesion del usuario actual.
   No modifica una tarea existente que pertenezca a otra ruta.
3. El equipo debe estar encendido, la sesion iniciada y MySQL disponible.
   El backend y el navegador pueden estar cerrados. Si se pierde la hora,
   la tarea solicita ejecucion cuando vuelva a estar disponible y reintenta
   hasta tres veces si falla. No puede ejecutarse con el equipo apagado.
4. Para generar ademas un respaldo manual:
   ```powershell
   npm --prefix backend-node run backup
   ```
5. Para revisar la programacion y el resultado (0 significa exito):
   ```powershell
   Get-ScheduledTaskInfo -TaskName 'MujerMagica-BackupDiario-1800'
   ```

El generador publica el archivo `.sql` solo si `mysqldump` termina con exito
y el archivo tiene la marca de finalizacion. Los `.partial` fallidos se
eliminan. Solo se crea un respaldo **diario** por fecha; los manuales son
independientes. No se guarda la contrasena en los argumentos del proceso:
se usa un archivo temporal privado y se elimina al terminar.

Se utiliza un bloqueo global de lectura de MySQL mientras se realiza el dump
para evitar cambios durante su lectura; puede hacer esperar brevemente a
los guardados. El usuario MySQL necesita permisos para ese bloqueo y para
leer los objetos incluidos. Una marca de finalizacion no sustituye una
prueba de restauracion en una base de datos separada.

**Privacidad:** los respaldos contienen datos sensibles. La carpeta se excluye
de Git y se limita a la cuenta de Windows que ejecuta la tarea. No publiques
`backup diario` por HTTP: un servidor estatico que sirva toda la carpeta
`Fuentes` podria exponerlos aunque tengan permisos privados de Windows.
El servidor frontend debe bloquear esa ruta; los permisos del sistema de
archivos no bloquean un servidor que corre con tu misma cuenta.
Conserva tambien una copia fuera de este equipo.

Este respaldo no corrige el riesgo del guardado actual por reemplazo de tablas.
No actualiza el backend en ejecucion ni aplica migraciones. Antes de una
actualizacion, genera y comprueba un respaldo manual y evita guardados
simultaneos; no restaures nunca sobre la base real para probar un respaldo.

## Pruebas

Desde esta carpeta, ejecuta `npm test` (Node.js 18 o posterior). Las pruebas usan
datos aislados y no escriben en MySQL. Cubren ventas mixtas, precio historico,
stock, costos desconocidos y persistencia mediante consultas simuladas.
