package com.grocery.management.controller;

import com.grocery.management.entity.Voucher;
import com.grocery.management.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public ResponseEntity<?> getAllVouchers() {
        return ResponseEntity.ok(voucherService.getAllVouchers());
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveVouchers() {
        return ResponseEntity.ok(voucherService.getActiveVouchers());
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateVoucher(@RequestParam String code) {
        try {
            return ResponseEntity.ok(voucherService.validateVoucher(code));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createVoucher(@RequestBody Voucher voucher) {
        try {
            return ResponseEntity.ok(voucherService.createVoucher(voucher));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateVoucher(@PathVariable Long id, @RequestBody Voucher voucher) {
        try {
            return ResponseEntity.ok(voucherService.updateVoucher(id, voucher));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVoucher(@PathVariable Long id) {
        try {
            voucherService.deleteVoucher(id);
            return ResponseEntity.ok("Xóa thành công voucher");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
