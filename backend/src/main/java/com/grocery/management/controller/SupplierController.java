package com.grocery.management.controller;

import com.grocery.management.entity.Supplier;
import com.grocery.management.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.lang.NonNull;

import java.util.List;

@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
public class SupplierController {
    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<List<Supplier>> getAll() {
        return ResponseEntity.ok(supplierService.getAllSuppliers());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Supplier supplier) {
        try {
            return ResponseEntity.ok(supplierService.createSupplier(supplier));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable @NonNull Long id, @RequestBody Supplier supplier) {
        try {
            return ResponseEntity.ok(supplierService.updateSupplier(id, supplier));
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