# 🛍️ Cantidad en Punto de Venta - Guía de Uso

## ✅ Característica Implementada

Ahora puedes **especificar la cantidad de productos** antes de agregar al carrito, sin necesidad de dar múltiples clicks.

---

## 🎯 Cómo Funciona

### Antes (Antiguo Flujo)
```
Quería 10 Shampoos → Clic 10 veces en el producto
```

### Ahora (Nuevo Flujo)
```
Quiero 10 Shampoos → Especifico 10 en el input → 1 click "Agregar al carrito"
```

---

## 📖 Paso a Paso

### 1️⃣ Abre el Punto de Venta (POS)
Ve a tu aplicación y haz click en **"🛒 Punto de Venta"** en el menú lateral.

### 2️⃣ Encuentra el Producto
Busca o desplázate por los productos disponibles (ejemplo: Shampoo Kativa).

### 3️⃣ Especifica la Cantidad
Cada producto ahora tiene:

```
        −  [1]  +    ← Controles de cantidad
   
   Agregar al carrito  ← Botón
```

**Opciones:**
- **Input de cantidad** (en el centro): Escribe directamente el número
- **Botón −**: Decrementa en 1
- **Botón +**: Incrementa en 1
- Mínimo: 1 | Máximo: Stock disponible

### 4️⃣ Haz Click en "Agregar al carrito"
El producto se agrega **con la cantidad especificada** en una sola acción.

### 5️⃣ El Input se Reinicia
Automáticamente vuelve a 1, listo para el siguiente producto.

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Venta Normal
```
Cliente: "Necesito 5 Shampoos y 3 Brillos Labiales"

Pasos:
1. Busca "Shampoo Kativa"
2. Especifica: 5
3. Click "Agregar al carrito"
4. Busca "Brillos Labiales"
5. Especifica: 3
6. Click "Agregar al carrito"
7. ¡Listo! El carrito tiene ambos productos

Antes: 8 clicks
Ahora: 2 clicks
```

### Ejemplo 2: Compra al por Mayor
```
Cliente: "Necesito 50 Shampoos"

Pasos:
1. Busca "Shampoo Kativa"
2. Especifica: 50
3. Click "Agregar al carrito"
4. ¡Listo!

Antes: 50 clicks
Ahora: 1 click
```

### Ejemplo 3: Ajuste Manual
```
Quería 10 pero me arrepentí

Opciones:
A) Borrar el input y escribir nuevo número
B) Usar botón "−" para decrementar (9 clicks)
C) Usar botón "+" para incrementar (8 clicks)
```

---

## ⚙️ Características del Input

| Característica | Detalles |
|---|---|
| **Valor Inicial** | 1 |
| **Mínimo** | 1 |
| **Máximo** | Stock disponible del producto |
| **Editable** | Sí, puedes escribir directamente |
| **Incremento** | Botón + suma 1 |
| **Decremento** | Botón − resta 1 |
| **Reset** | Vuelve a 1 después de agregar al carrito |

---

## 🚀 Ventajas

✅ **Más rápido**: Menos clicks para compras grandes  
✅ **Más intuitivo**: Especifica exactamente lo que quieres  
✅ **Más flexible**: Puedes escribir o usar los botones  
✅ **Sin errores**: El máximo está limitado al stock disponible  
✅ **Mejor UX**: La cantidad se reinicia automáticamente  

---

## 📱 Responsive

Funciona perfecto en:
- 📱 Móvil (pequeño)
- 💻 Tablet
- 🖥️ Escritorio

Los inputs y botones se adaptan automáticamente al tamaño de la pantalla.

---

## 🛒 Carrito

Después de agregar productos con cantidad:

```
Carrito:
- 5x Shampoo Kativa          $145,000
- 3x Brillos Labiales         $66,000

Subtotal:                      $211,000
IVA 19%:                        $40,090
Total:                         $251,090

[Procesar venta]
```

La cantidad se refleja correctamente en el carrito.

---

## ✨ Resumen

| Antes | Ahora |
|-------|-------|
| 1 click = 1 producto | 1 click = N productos |
| Tedioso para cantidades grandes | Rápido y eficiente |
| Sin entrada de cantidad | Input flexible |
| Botones fijos | Botones +/- responsivos |

**¡Mucho más productivo!** 🎉
