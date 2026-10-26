package com.mujermagica.inventario.provider;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProviderRequest(
    @NotBlank(message = "Nombre es obligatorio")
    @Size(max = 140, message = "Nombre excede 140 caracteres")
    String name,
    @Size(max = 120, message = "Contacto excede 120 caracteres")
    String contact,
    @Size(max = 40, message = "Telefono excede 40 caracteres")
    String phone,
    @Email(message = "Correo invalido")
    @Size(max = 140, message = "Correo excede 140 caracteres")
    String email,
    boolean active
) {}
