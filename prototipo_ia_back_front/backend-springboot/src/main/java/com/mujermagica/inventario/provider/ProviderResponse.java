package com.mujermagica.inventario.provider;

public record ProviderResponse(
    Long id,
    String name,
    String contact,
    String phone,
    String email,
    boolean active
) {
    public static ProviderResponse fromEntity(Provider provider) {
        return new ProviderResponse(
            provider.getId(),
            provider.getName(),
            provider.getContact(),
            provider.getPhone(),
            provider.getEmail(),
            provider.isActive()
        );
    }
}
