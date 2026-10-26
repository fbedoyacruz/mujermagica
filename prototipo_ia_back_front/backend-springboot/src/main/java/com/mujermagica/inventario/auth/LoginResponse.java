package com.mujermagica.inventario.auth;

public record LoginResponse(
    String token,
    String username,
    String role
) {}
