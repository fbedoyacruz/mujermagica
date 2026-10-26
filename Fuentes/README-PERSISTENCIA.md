# 📦 Persistencia de Base de Datos - Mujer Mágica POS

## ✅ Característica Implementada

La base de datos ahora **persiste en el navegador** usando `localStorage`. Todos los cambios se guardan automáticamente:

### Operaciones que Guardan Automáticamente:
- ➕ **Crear producto** → Se guarda en localStorage
- ✏️ **Editar producto** → Se guarda en localStorage
- ➕ **Crear proveedor** → Se guarda en localStorage
- ✏️ **Editar proveedor** → Se guarda en localStorage
- ➕ **Crear cliente** → Se guarda en localStorage
- ✏️ **Editar cliente** → Se guarda en localStorage
- 💳 **Confirmar venta** → Se guarda en localStorage (incluyendo stock actualizado)

## 🎯 Cómo Funciona

### En el Primer Ingreso:
1. La aplicación carga datos por defecto (8 productos, 3 proveedores, 2 clientes, 45 ventas de demostración)
2. Se guardan automáticamente en `localStorage` con la clave `"mujermagicaDB"`

### En Ingresos Posteriores:
1. La aplicación carga desde `localStorage` en lugar de datos por defecto
2. Todos tus cambios se conservan
3. Los datos nunca se pierden (a menos que limpies el cache del navegador)

### Indicador Visual:
Cada vez que se guarda, aparece un pequeño indicador verde "✓ Guardado" en la esquina superior derecha que desaparece automáticamente.

## 🔧 Funciones de Administración

### Restaurar Base de Datos a Valores Iniciales
```javascript
resetDatabase()
```
**Efecto**: Elimina TODOS los cambios y vuelve a los datos por defecto.
**Advertencia**: Muestra una confirmación antes de ejecutar.

### Exportar Base de Datos
```javascript
exportDatabase()
```
**Efecto**: Descarga un archivo JSON con toda la BD actualizada.
**Formato**: `mujer-magica-backup-YYYY-MM-DD.json`
**Uso**: Para respaldo seguro de tus datos.

## 📋 Dónde Ver los Datos Guardados

En tu navegador:
1. Abre Developer Tools (F12)
2. Ve a **Application** → **Storage** → **Local Storage**
3. Busca la entrada para tu sitio
4. Verás la clave `"mujermagicaDB"` con todo tu contenido

## 🛡️ Respaldo de Datos

### Recomendaciones:
- **Exporta regularmente** usando `exportDatabase()` para tener backups seguros
- Los datos en localStorage pueden perderse si:
  - Limpias el cache del navegador
  - Desinstales el navegador
  - Cambias de navegador
  - Cambias de dispositivo

### Restaurar desde Backup:
Para usar un backup en el futuro:
1. Abre la DevTools (F12)
2. Ve a **Console**
3. Copia el JSON del backup
4. Ejecuta:
```javascript
localStorage.setItem("mujermagicaDB", '<PEGA_EL_JSON_AQUI>')
location.reload()
```

## 🚀 Casos de Uso

### ✅ Caso 1: Trabajo Diario Normal
- Ingresa a la aplicación
- Crea/edita productos, proveedores, clientes
- Las venta se registran
- Todo se guarda automáticamente
- Cierra el navegador sin miedo a perder datos
- Cuando vuelves a ingresar, ¡todo está allí!

### ✅ Caso 2: Transferencia a Otro Dispositivo
1. En tu dispositivo actual: ejecuta `exportDatabase()`
2. Descarga el archivo JSON
3. En el otro dispositivo: copia el contenido del JSON
4. Ejecuta el comando de restauración en DevTools
5. ¡Todos tus datos ahora están en el otro dispositivo!

### ✅ Caso 3: "Cometí un Error"
1. Ejecuta `resetDatabase()` para volver a datos por defecto
2. O restaura desde un backup anterior usando el comando de DevTools

## 💡 Notas Técnicas

- **Almacenamiento**: localStorage del navegador (límite típico: 5-10MB)
- **Sincronización**: Guardado inmediato y automático
- **Seguridad**: Los datos están en tu dispositivo (no en internet)
- **Compatibilidad**: Funciona en todos los navegadores modernos (Chrome, Firefox, Safari, Edge)

## 📝 Resumen

| Aspecto | Detalles |
|--------|----------|
| **Guardado** | ✓ Automático en cada operación |
| **Persistencia** | ✓ Datos guardados en localStorage |
| **Indicador** | ✓ Mensaje "✓ Guardado" en esquina superior derecha |
| **Backup** | ✓ Función `exportDatabase()` disponible |
| **Reset** | ✓ Función `resetDatabase()` para volver a valores iniciales |

---

**¡Tu base de datos está protegida y persiste automáticamente!** 🎉
