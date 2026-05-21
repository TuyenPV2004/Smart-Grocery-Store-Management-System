package com.grocery.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.grocery.management.entity.Supplier;
import com.grocery.management.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.lang.NonNull;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {
    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<List<Supplier>> getAll() {
        return ResponseEntity.ok(supplierService.getAllSuppliers());
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createJson(@RequestBody Supplier supplier) {
        try {
            return ResponseEntity.ok(supplierService.createSupplier(supplier));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(
            @RequestParam("supplier") String supplierJson,
            @RequestParam(value = "logo", required = false) MultipartFile logo) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            Supplier supplier = mapper.readValue(supplierJson, Supplier.class);
            return ResponseEntity.ok(supplierService.createSupplier(supplier, logo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateJson(@PathVariable @NonNull Long id, @RequestBody Supplier supplier) {
        try {
            return ResponseEntity.ok(supplierService.updateSupplier(id, supplier));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> update(
            @PathVariable @NonNull Long id,
            @RequestParam("supplier") String supplierJson,
            @RequestParam(value = "logo", required = false) MultipartFile logo) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            Supplier supplier = mapper.readValue(supplierJson, Supplier.class);
            return ResponseEntity.ok(supplierService.updateSupplier(id, supplier, logo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> toggleStatus(@PathVariable @NonNull Long id) {
        supplierService.toggleStatus(id);
        return ResponseEntity.ok("Cập nhật trạng thái thành công");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable @NonNull Long id) {
        try {
            supplierService.deleteSupplier(id);
            return ResponseEntity.ok("Xóa nhà cung cấp thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}
