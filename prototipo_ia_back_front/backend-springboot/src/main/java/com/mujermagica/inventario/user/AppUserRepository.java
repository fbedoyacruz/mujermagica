package com.mujermagica.inventario.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsernameAndActiveTrue(String username);
    Optional<AppUser> findByUsername(String username);
}
