package com.mujermagica.inventario.customer;

import com.mujermagica.inventario.common.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public Page<CustomerResponse> list(@RequestParam(required = false) String search, Pageable pageable) {
        Page<Customer> page = (search == null || search.isBlank())
            ? customerRepository.findAll(pageable)
            : customerRepository.findByNameContainingIgnoreCaseOrDocumentContainingIgnoreCase(search, search, pageable);

        return page.map(CustomerResponse::fromEntity);
    }

    @GetMapping("/{id}")
    public CustomerResponse getById(@PathVariable Long id) {
        Customer customer = customerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));
        return CustomerResponse.fromEntity(customer);
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CustomerRequest request) {
        Customer customer = new Customer();
        customer.setName(request.name().trim());
        customer.setDocument(request.document().trim());
        customer.setPhone(request.phone());
        customer.setEmail(request.email());
        customer.setActive(request.active());

        Customer saved = customerRepository.save(customer);
        return ResponseEntity.status(HttpStatus.CREATED).body(CustomerResponse.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public CustomerResponse update(@PathVariable Long id, @Valid @RequestBody CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));

        customer.setName(request.name().trim());
        customer.setDocument(request.document().trim());
        customer.setPhone(request.phone());
        customer.setEmail(request.email());
        customer.setActive(request.active());

        return CustomerResponse.fromEntity(customerRepository.save(customer));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Customer customer = customerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado: " + id));
        customerRepository.delete(customer);
        return ResponseEntity.noContent().build();
    }
}
