package com.mujermagica.inventario.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductRequest(
    @NotBlank(message = "Nombre es obligatorio")
    @Size(max = 160, message = "Nombre excede 160 caracteres")
    String name,
    @NotBlank(message = "SKU es obligatorio")
    @Size(max = 80, message = "SKU excede 80 caracteres")
    String sku,
    @NotBlank(message = "Marca es obligatoria")
    @Size(max = 120, message = "Marca excede 120 caracteres")
    String brand,
    @NotNull(message = "Precio compra es obligatorio")
    @DecimalMin(value = "0.0", message = "Precio compra no puede ser negativo")
    BigDecimal priceBuy,
    @NotNull(message = "Precio venta es obligatorio")
    @DecimalMin(value = "0.0", message = "Precio venta no puede ser negativo")
    BigDecimal priceSell,
    Long providerId,
    boolean active
) {}
