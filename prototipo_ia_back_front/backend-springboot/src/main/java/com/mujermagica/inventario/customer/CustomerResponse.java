package com.mujermagica.inventario.customer;

public record CustomerResponse(
    Long id,
    String name,
    String document,
    String phone,
    String email,
    boolean active
) {
    public static CustomerResponse fromEntity(Customer customer) {
        return new CustomerResponse(
            customer.getId(),
            customer.getName(),
            customer.getDocument(),
            customer.getPhone(),
            customer.getEmail(),
            customer.isActive()
        );
    }
}
