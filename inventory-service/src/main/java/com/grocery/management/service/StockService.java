package com.grocery.management.service;

import com.grocery.management.dto.BatchExpiryDTO;
import com.grocery.management.dto.StockCardDTO;
import com.grocery.management.dto.StockSummaryDTO;
import com.grocery.management.entity.InventoryType;
import com.grocery.management.repository.InventoryNoteDetailRepository;
import com.grocery.management.repository.InventoryNoteRepository;
import com.grocery.management.repository.ProductBatchRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StockService {
    private final ProductBatchRepository productBatchRepository;
    private final InventoryNoteRepository inventoryNoteRepository;
    private final InventoryNoteDetailRepository inventoryNoteDetailRepository;

    public List<StockSummaryDTO> getStockSummary() {
        List<StockSummaryDTO> summary = productBatchRepository.getStockSummary();
        Map<Long, Long[]> statsMap = new HashMap<>();
        for (Object[] row : inventoryNoteDetailRepository.getProductFlowStats()) {
            Long productId = (Long) row[0];
            InventoryType type = (InventoryType) row[1];
            Long quantity = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            Integer rate = row[3] != null ? ((Number) row[3]).intValue() : 1;
            statsMap.putIfAbsent(productId, new Long[] {0L, 0L, 1L});
            if (type == InventoryType.IMPORT) {
                statsMap.get(productId)[0] += quantity;
                statsMap.get(productId)[2] = Math.max(statsMap.get(productId)[2], Long.valueOf(rate));
            } else if (type == InventoryType.EXPORT) {
                statsMap.get(productId)[1] += quantity;
            }
        }

        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysFromNow = today.plusDays(30);
        for (StockSummaryDTO dto : summary) {
            Long[] stats = statsMap.get(dto.getProductId());
            if (stats != null) {
                dto.setTotalImported(stats[0]);
                dto.setTotalExported(stats[1]);
                dto.setConversionRate(stats[2].intValue());
            }
            if (dto.getTotalQuantity() == null || dto.getTotalQuantity() == 0) {
                dto.setStatus("OUT_OF_STOCK");
            } else if (dto.getTotalQuantity() < 10) {
                dto.setStatus("LOW_STOCK");
            } else if (dto.getNearestExpiryDate() != null && dto.getNearestExpiryDate().isBefore(thirtyDaysFromNow)) {
                dto.setStatus("NEAR_EXPIRY");
            } else {
                dto.setStatus("NORMAL");
            }
        }
        return summary;
    }

    public List<StockSummaryDTO> getStockSummaryByStatus(String status) {
        return getStockSummary().stream()
                .filter(dto -> status == null || status.isBlank() || status.equals(dto.getStatus()))
                .toList();
    }

    public StockDashboardStats getDashboardStats() {
        List<StockSummaryDTO> summary = getStockSummary();
        long totalValue = summary.stream().mapToLong(dto -> dto.getStockValue().longValue()).sum();
        long expiringBatches = summary.stream().filter(dto -> "NEAR_EXPIRY".equals(dto.getStatus())).count();
        long lowStockItems = summary.stream()
                .filter(dto -> "LOW_STOCK".equals(dto.getStatus()) || "OUT_OF_STOCK".equals(dto.getStatus()))
                .count();
        return new StockDashboardStats(totalValue, expiringBatches, lowStockItems);
    }

    public List<BatchExpiryDTO> getBatchesWithExpiryStatus() {
        List<BatchExpiryDTO> batches = productBatchRepository.getBatchesWithExpiry();
        LocalDate today = LocalDate.now();
        for (BatchExpiryDTO dto : batches) {
            if (dto.getExpiryDate() == null) {
                dto.setStatus("SAFE");
                dto.setDaysUntilExpiry(999);
                continue;
            }
            long days = ChronoUnit.DAYS.between(today, dto.getExpiryDate());
            dto.setDaysUntilExpiry((int) days);
            if (days < 0) {
                dto.setStatus("EXPIRED");
            } else if (days <= 30) {
                dto.setStatus("EXPIRING_SOON");
            } else {
                dto.setStatus("SAFE");
            }
        }
        return batches;
    }

    public List<BatchExpiryDTO> getBatchesByStatus(String status) {
        return getBatchesWithExpiryStatus().stream()
                .filter(dto -> status == null || status.isBlank() || status.equals(dto.getStatus()))
                .toList();
    }

    public List<StockCardDTO> getStockCard(Long productId) {
        List<StockCardDTO> history = inventoryNoteRepository.getStockCardHistory(productId);
        int balance = 0;
        for (StockCardDTO card : history) {
            balance += card.getQuantityChange();
            card.setRunningBalance(balance);
        }
        Collections.reverse(history);
        return history;
    }

    @Data
    @AllArgsConstructor
    public static class StockDashboardStats {
        private long totalValue;
        private long expiringBatches;
        private long lowStockItems;
    }
}
