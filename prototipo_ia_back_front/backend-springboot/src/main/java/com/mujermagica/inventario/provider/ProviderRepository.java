package com.mujermagica.inventario.provider;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProviderRepository extends JpaRepository<Provider, Long> {
    Page<Provider> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
