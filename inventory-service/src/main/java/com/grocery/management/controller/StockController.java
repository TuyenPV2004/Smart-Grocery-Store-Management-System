package com.grocery.management.controller;

import com.grocery.management.dto.BatchExpiryDTO;
import com.grocery.management.dto.StockCardDTO;
import com.grocery.management.dto.StockSummaryDTO;
import com.grocery.management.service.StockService;
import com.grocery.management.service.StockService.StockDashboardStats;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {
    private final StockService stockService;

    @GetMapping("/summary")
    public ResponseEntity<List<StockSummaryDTO>> getStockSummary(@RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(stockService.getStockSummaryByStatus(status));
        }
        return ResponseEntity.ok(stockService.getStockSummary());
    }

    @GetMapping("/dashboard")
    public ResponseEntity<StockDashboardStats> getDashboardStats() {
        return ResponseEntity.ok(stockService.getDashboardStats());
    }

    @GetMapping("/batches/expiry")
    public ResponseEntity<List<BatchExpiryDTO>> getBatchesWithExpiry(@RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(stockService.getBatchesByStatus(status));
        }
        return ResponseEntity.ok(stockService.getBatchesWithExpiryStatus());
    }

    @GetMapping("/card/{productId}")
    public ResponseEntity<List<StockCardDTO>> getStockCard(@PathVariable Long productId) {
        return ResponseEntity.ok(stockService.getStockCard(productId));
    }
}
