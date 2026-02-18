package com.grocery.management.service;

import com.grocery.management.dto.StockSummaryDTO;
import com.grocery.management.dto.BatchExpiryDTO;
import com.grocery.management.dto.StockCardDTO;
import com.grocery.management.repository.ProductBatchRepository;
import com.grocery.management.repository.InventoryNoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class StockService {

    @Autowired
    private ProductBatchRepository productBatchRepository;

    @Autowired
    private InventoryNoteRepository inventoryNoteRepository;

    @Autowired
    private com.grocery.management.repository.InventoryNoteDetailRepository inventoryNoteDetailRepository;

    /**
     * Get stock summary with status calculation
     * Status logic:
     * - OUT_OF_STOCK: totalQuantity = 0
     * - LOW_STOCK: totalQuantity < 10
     * - NEAR_EXPIRY: has batch expiring within 30 days
     * - NORMAL: otherwise
     */
    public List<StockSummaryDTO> getStockSummary() {
        // 1. Get snapshot based on Product Batch (Current Stock)
        // Note: This only returns products that have active batches (quantity > 0)
        // If we want ALL products, we might need a different base query.
        // For now, let's stick to this but enrich it.
        // If "No products found", it means no active batches.
        // To fix "No products found" if they have 0 stock but have history, we should
        // fetch distinct products from history too.

        List<StockSummaryDTO> summary = productBatchRepository.getStockSummary();

        // 2. Compute Flow Stats (Import/Export History)
        List<Object[]> flowStats = inventoryNoteDetailRepository.getProductFlowStats();

        // Map: ProductID -> [TotalImport, TotalExport, ConversionRate]
        java.util.Map<Long, Long[]> statsMap = new java.util.HashMap<>();
        for (Object[] row : flowStats) { // [productId, type, sumQty, conversionRate]
            Long pId = (Long) row[0];
            com.grocery.management.entity.InventoryType type = (com.grocery.management.entity.InventoryType) row[1];
            Long qty = (Long) row[2]; // This is now ImportUnitQty for Imports
            Integer rate = (Integer) row[3];

            statsMap.putIfAbsent(pId, new Long[] { 0L, 0L, 1L });
            // 0: Import, 1: Export, 2: ConversionRate
            if (type == com.grocery.management.entity.InventoryType.IMPORT) {
                statsMap.get(pId)[0] += qty;
                // Store max conversion rate found (simplified logic)
                if (rate != null && rate > statsMap.get(pId)[2]) {
                    statsMap.get(pId)[2] = Long.valueOf(rate);
                }
            } else if (type == com.grocery.management.entity.InventoryType.EXPORT) {
                statsMap.get(pId)[1] += qty;
            }
        }

        // 3. Merge Flow Stats into Summary
        for (StockSummaryDTO dto : summary) {
            if (statsMap.containsKey(dto.getProductId())) {
                Long[] stats = statsMap.get(dto.getProductId());
                dto.setTotalImported(stats[0]);
                dto.setTotalExported(stats[1]);
                dto.setConversionRate(stats[2].intValue());
            }
        }

        // 4. Calculate Status
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysFromNow = today.plusDays(30);

        for (StockSummaryDTO dto : summary) {
            // Calculate status
            if (dto.getTotalQuantity() == null || dto.getTotalQuantity() == 0) {
                dto.setStatus("OUT_OF_STOCK");
            } else if (dto.getTotalQuantity() < 10) {
                dto.setStatus("LOW_STOCK");
            } else if (dto.getNearestExpiryDate() != null &&
                    dto.getNearestExpiryDate().isBefore(thirtyDaysFromNow)) {
                dto.setStatus("NEAR_EXPIRY");
            } else {
                dto.setStatus("NORMAL");
            }
        }

        return summary;
    }

    /**
     * Get stock summary filtered by status
     */
    public List<StockSummaryDTO> getStockSummaryByStatus(String status) {
        List<StockSummaryDTO> allSummary = getStockSummary();

        if (status == null || status.isEmpty()) {
            return allSummary;
        }

        return allSummary.stream()
                .filter(dto -> status.equals(dto.getStatus()))
                .toList();
    }

    /**
     * Get dashboard statistics
     */
    public StockDashboardStats getDashboardStats() {
        List<StockSummaryDTO> summary = getStockSummary();

        long totalValue = summary.stream()
                .mapToLong(dto -> dto.getStockValue().longValue())
                .sum();

        long expiringBatches = summary.stream()
                .filter(dto -> "NEAR_EXPIRY".equals(dto.getStatus()))
                .count();

        long lowStockItems = summary.stream()
                .filter(dto -> "LOW_STOCK".equals(dto.getStatus()) || "OUT_OF_STOCK".equals(dto.getStatus()))
                .count();

        return new StockDashboardStats(totalValue, expiringBatches, lowStockItems);
    }

    /**
     * Get batches with expiry status (FEFO ordered)
     * Status logic:
     * - EXPIRED: expiryDate < today
     * - EXPIRING_SOON: expiryDate <= today + 30 days
     * - SAFE: otherwise
     */
    public List<BatchExpiryDTO> getBatchesWithExpiryStatus() {
        List<BatchExpiryDTO> batches = productBatchRepository.getBatchesWithExpiry();

        LocalDate today = LocalDate.now();

        for (BatchExpiryDTO dto : batches) {
            if (dto.getExpiryDate() == null) {
                dto.setStatus("SAFE");
                dto.setDaysUntilExpiry(999);
                continue;
            }

            long daysUntilExpiry = ChronoUnit.DAYS.between(today, dto.getExpiryDate());
            dto.setDaysUntilExpiry((int) daysUntilExpiry);

            if (daysUntilExpiry < 0) {
                dto.setStatus("EXPIRED");
            } else if (daysUntilExpiry <= 30) {
                dto.setStatus("EXPIRING_SOON");
            } else {
                dto.setStatus("SAFE");
            }
        }

        return batches;
    }

    /**
     * Get batches filtered by status
     */
    public List<BatchExpiryDTO> getBatchesByStatus(String status) {
        List<BatchExpiryDTO> allBatches = getBatchesWithExpiryStatus();

        if (status == null || status.isEmpty()) {
            return allBatches;
        }

        return allBatches.stream()
                .filter(dto -> status.equals(dto.getStatus()))
                .toList();
    }

    /**
     * Get stock card history for a product with running balance
     */
    public List<StockCardDTO> getStockCard(Long productId) {
        List<StockCardDTO> history = inventoryNoteRepository.getStockCardHistory(productId);

        // Calculate running balance (cumulative sum)
        int balance = 0;
        for (StockCardDTO card : history) {
            balance += card.getQuantityChange();
            card.setRunningBalance(balance);
        }

        // Reverse to show newest first
        java.util.Collections.reverse(history);

        return history;
    }

    // Inner class for dashboard stats
    public static class StockDashboardStats {
        private long totalValue;
        private long expiringBatches;
        private long lowStockItems;

        public StockDashboardStats(long totalValue, long expiringBatches, long lowStockItems) {
            this.totalValue = totalValue;
            this.expiringBatches = expiringBatches;
            this.lowStockItems = lowStockItems;
        }

        public long getTotalValue() {
            return totalValue;
        }

        public long getExpiringBatches() {
            return expiringBatches;
        }

        public long getLowStockItems() {
            return lowStockItems;
        }
    }
}
