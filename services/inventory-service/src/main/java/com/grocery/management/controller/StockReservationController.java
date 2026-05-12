package com.grocery.management.controller;

import com.grocery.management.dto.StockReservationRequest;
import com.grocery.management.service.StockReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory/reservations")
@RequiredArgsConstructor
public class StockReservationController {
    private final StockReservationService stockReservationService;

    @PostMapping
    public ResponseEntity<?> reserve(@RequestBody StockReservationRequest request) {
        return ResponseEntity.ok(stockReservationService.reserve(request));
    }

    @PostMapping("/{orderCode}/commit")
    public ResponseEntity<?> commit(@PathVariable String orderCode) {
        return ResponseEntity.ok(stockReservationService.commit(orderCode));
    }

    @PostMapping("/{orderCode}/release")
    public ResponseEntity<?> release(@PathVariable String orderCode) {
        return ResponseEntity.ok(stockReservationService.release(orderCode));
    }
}
