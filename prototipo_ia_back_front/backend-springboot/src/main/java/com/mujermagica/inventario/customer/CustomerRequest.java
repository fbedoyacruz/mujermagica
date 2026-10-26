package com.mujermagica.inventario.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerRequest(
    @NotBlank(message = "Nombre es obligatorio")
    @Size(max = 140, message = "Nombre excede 140 caracteres")
    String name,
    @NotBlank(message = "Documento es obligatorio")
    @Size(max = 60, message = "Documento excede 60 caracteres")
    String document,
    @Size(max = 40, message = "Telefono excede 40 caracteres")
    String phone,
    @Email(message = "Correo invalido")
    @Size(max = 140, message = "Correo excede 140 caracteres")
    String email,
    boolean active
) {}
