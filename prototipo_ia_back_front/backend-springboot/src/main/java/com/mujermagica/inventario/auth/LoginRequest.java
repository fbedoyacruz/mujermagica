package com.mujermagica.inventario.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "Usuario es obligatorio")
    String username,
    @NotBlank(message = "Clave es obligatoria")
    String password
) {}
