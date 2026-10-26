package com.mujermagica.inventario.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByNameContainingIgnoreCaseOrSkuContainingIgnoreCaseOrBrandContainingIgnoreCase(
        String name,
        String sku,
        String brand,
        Pageable pageable
    );

    boolean existsBySkuAndIdNot(String sku, Long id);
}
