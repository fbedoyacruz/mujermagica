package com.mujermagica.inventario.provider;

import com.mujermagica.inventario.common.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/providers")
public class ProviderController {

    private final ProviderRepository providerRepository;

    public ProviderController(ProviderRepository providerRepository) {
        this.providerRepository = providerRepository;
    }

    @GetMapping
    public Page<ProviderResponse> list(@RequestParam(required = false) String search, Pageable pageable) {
        Page<Provider> page = (search == null || search.isBlank())
            ? providerRepository.findAll(pageable)
            : providerRepository.findByNameContainingIgnoreCase(search, pageable);

        return page.map(ProviderResponse::fromEntity);
    }

    @GetMapping("/{id}")
    public ProviderResponse getById(@PathVariable Long id) {
        Provider provider = providerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado: " + id));
        return ProviderResponse.fromEntity(provider);
    }

    @PostMapping
    public ResponseEntity<ProviderResponse> create(@Valid @RequestBody ProviderRequest request) {
        Provider provider = new Provider();
        provider.setName(request.name().trim());
        provider.setContact(request.contact());
        provider.setPhone(request.phone());
        provider.setEmail(request.email());
        provider.setActive(request.active());

        Provider saved = providerRepository.save(provider);
        return ResponseEntity.status(HttpStatus.CREATED).body(ProviderResponse.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public ProviderResponse update(@PathVariable Long id, @Valid @RequestBody ProviderRequest request) {
        Provider provider = providerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado: " + id));

        provider.setName(request.name().trim());
        provider.setContact(request.contact());
        provider.setPhone(request.phone());
        provider.setEmail(request.email());
        provider.setActive(request.active());

        return ProviderResponse.fromEntity(providerRepository.save(provider));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Provider provider = providerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado: " + id));
        providerRepository.delete(provider);
        return ResponseEntity.noContent().build();
    }
}
