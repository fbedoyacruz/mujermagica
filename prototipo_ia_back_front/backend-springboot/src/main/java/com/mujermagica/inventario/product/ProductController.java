package com.mujermagica.inventario.product;

import com.mujermagica.inventario.common.ResourceNotFoundException;
import com.mujermagica.inventario.provider.Provider;
import com.mujermagica.inventario.provider.ProviderRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductRepository productRepository;
    private final ProviderRepository providerRepository;

    public ProductController(ProductRepository productRepository, ProviderRepository providerRepository) {
        this.productRepository = productRepository;
        this.providerRepository = providerRepository;
    }

    @GetMapping
    public Page<ProductResponse> list(@RequestParam(required = false) String search, Pageable pageable) {
        Page<Product> page = (search == null || search.isBlank())
            ? productRepository.findAll(pageable)
            : productRepository.findByNameContainingIgnoreCaseOrSkuContainingIgnoreCaseOrBrandContainingIgnoreCase(
                search,
                search,
                search,
                pageable
            );

        return page.map(ProductResponse::fromEntity);
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));
        return ProductResponse.fromEntity(product);
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        if (productRepository.existsBySkuAndIdNot(request.sku().trim(), -1L)) {
            throw new IllegalArgumentException("El SKU ya existe");
        }

        Product product = new Product();
        applyRequest(product, request);

        Product saved = productRepository.save(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(ProductResponse.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));

        if (productRepository.existsBySkuAndIdNot(request.sku().trim(), id)) {
            throw new IllegalArgumentException("El SKU ya existe");
        }

        applyRequest(product, request);
        return ProductResponse.fromEntity(productRepository.save(product));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));
        productRepository.delete(product);
        return ResponseEntity.noContent().build();
    }

    private void applyRequest(Product product, ProductRequest request) {
        product.setName(request.name().trim());
        product.setSku(request.sku().trim());
        product.setBrand(request.brand().trim());
        product.setPriceBuy(request.priceBuy());
        product.setPriceSell(request.priceSell());
        product.setActive(request.active());

        if (request.providerId() != null) {
            Provider provider = providerRepository.findById(request.providerId())
                .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado: " + request.providerId()));
            product.setProvider(provider);
        } else {
            product.setProvider(null);
        }
    }
}
