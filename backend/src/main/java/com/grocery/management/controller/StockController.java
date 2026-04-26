package com.grocery.management.controller;

import com.grocery.management.dto.StockSummaryDTO;
import com.grocery.management.dto.BatchExpiryDTO;
import com.grocery.management.dto.StockCardDTO;
import com.grocery.management.service.StockService;
import com.grocery.management.service.StockService.StockDashboardStats;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
public class StockController {

    @Autowired
    private StockService stockService;

    /**
     * Get stock summary for all products
     * GET /api/stocks/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<List<StockSummaryDTO>> getStockSummary(
            @RequestParam(required = false) String status) {

        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(stockService.getStockSummaryByStatus(status));
        }

        return ResponseEntity.ok(stockService.getStockSummary());
    }

    /**
     * Get dashboard statistics
     * GET /api/stocks/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<StockDashboardStats> getDashboardStats() {
        return ResponseEntity.ok(stockService.getDashboardStats());
    }

    /**
     * Get batches with expiry status (FEFO ordered)
     * GET /api/stocks/batches/expiry
     */
    @GetMapping("/batches/expiry")
    public ResponseEntity<List<BatchExpiryDTO>> getBatchesWithExpiry(
            @RequestParam(required = false) String status) {

        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(stockService.getBatchesByStatus(status));
        }

        return ResponseEntity.ok(stockService.getBatchesWithExpiryStatus());
    }

    /**
     * Get stock card history for a product
     * GET /api/stocks/card/{productId}
     */
    @GetMapping("/card/{productId}")
    public ResponseEntity<List<StockCardDTO>> getStockCard(@PathVariable Long productId) {
        return ResponseEntity.ok(stockService.getStockCard(productId));
    }
}
