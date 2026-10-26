package com.mujermagica.inventario.product;

import java.math.BigDecimal;

public record ProductResponse(
    Long id,
    String name,
    String sku,
    String brand,
    BigDecimal priceBuy,
    BigDecimal priceSell,
    Long providerId,
    String providerName,
    boolean active
) {
    public static ProductResponse fromEntity(Product product) {
        Long providerId = product.getProvider() != null ? product.getProvider().getId() : null;
        String providerName = product.getProvider() != null ? product.getProvider().getName() : null;

        return new ProductResponse(
            product.getId(),
            product.getName(),
            product.getSku(),
            product.getBrand(),
            product.getPriceBuy(),
            product.getPriceSell(),
            providerId,
            providerName,
            product.isActive()
        );
    }
}
