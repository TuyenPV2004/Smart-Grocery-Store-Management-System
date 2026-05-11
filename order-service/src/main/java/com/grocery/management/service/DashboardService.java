package com.grocery.management.service;

import com.grocery.management.dto.BatchExpiryDTO;
import com.grocery.management.dto.DashboardDTO;
import com.grocery.management.dto.StockSummaryDTO;
import com.grocery.management.entity.Order;
import com.grocery.management.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private static final DateTimeFormatter MONTH_LABEL_FORMATTER = DateTimeFormatter.ofPattern("MM/yyyy");

    private final OrderRepository orderRepository;
    private final CatalogClient catalogClient;
    private final InventoryClient inventoryClient;

    public DashboardDTO getDashboardStats(Integer days) {
        int safeDays = normalizeDays(days);
        LocalDateTime startDate = calculateStartDate(safeDays);
        List<StockSummaryDTO> stockSummary = inventoryClient.getStockSummary();
        List<BatchExpiryDTO> batchExpiry = inventoryClient.getBatchesWithExpiryStatus();

        BigDecimal totalRevenue = defaultZero(orderRepository.sumTotalRevenueSince(startDate));
        long totalOrders = orderRepository.countByStatusAndCreatedAtGreaterThanEqual("COMPLETED", startDate);
        long totalProducts = catalogClient.countProducts();
        long pendingOrders = orderRepository.countByStatus("PENDING");
        long cancelledOrders = orderRepository.countByStatusAndCreatedAtGreaterThanEqual("CANCELLED", startDate);
        long expiringBatches7Days = countBatchesExpiringWithinDays(batchExpiry, 7);
        long expiringBatches30Days = countBatchesExpiringWithinDays(batchExpiry, 30);
        long lowStockProducts = stockSummary.stream()
                .filter(item -> "LOW_STOCK".equalsIgnoreCase(item.getStatus())
                        || "OUT_OF_STOCK".equalsIgnoreCase(item.getStatus()))
                .count();
        BigDecimal stockValue = stockSummary.stream()
                .map(item -> defaultZero(item.getStockValue()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalOrdersInRange = orderRepository.countByCreatedAtGreaterThanEqual(startDate);
        long onlineOrders = orderRepository.countByPaymentMethodAndCreatedAtGreaterThanEqual("CHUYEN_KHOAN", startDate);
        long successfulOnlineOrders = orderRepository
                .countByPaymentMethodAndPaymentStatusAndCreatedAtGreaterThanEqual("CHUYEN_KHOAN", "PAID", startDate);
        BigDecimal averageOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return DashboardDTO.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalProducts(totalProducts)
                .lowStockProducts(lowStockProducts)
                .pendingOrders(pendingOrders)
                .cancelledOrders(cancelledOrders)
                .expiringBatches7Days(expiringBatches7Days)
                .expiringBatches30Days(expiringBatches30Days)
                .stockValue(stockValue)
                .averageOrderValue(averageOrderValue)
                .cancellationRate(toPercentage(cancelledOrders, totalOrdersInRange))
                .vnPaySuccessRate(toPercentage(successfulOnlineOrders, onlineOrders))
                .monthlyRevenueComparison(buildMonthlyRevenueComparison())
                .revenueChart(buildRevenueChart(startDate, safeDays))
                .orderStatusChart(buildOrderStatusChart(startDate))
                .stockRiskChart(buildStockRiskChart(stockSummary, batchExpiry, expiringBatches7Days))
                .topProducts(getTopProducts(safeDays, 5))
                .categorySales(getCategorySales(safeDays))
                .recentOrders(mapRecentOrders(orderRepository.findTop5ByOrderByCreatedAtDesc()))
                .pendingOrderAlerts(mapRecentOrders(orderRepository.findTop5ByStatusOrderByCreatedAtDesc("PENDING")))
                .lowStockAlerts(buildLowStockAlerts(stockSummary))
                .expiringBatchAlerts(buildExpiringBatchAlerts(batchExpiry))
                .build();
    }

    public List<DashboardDTO.TopProduct> getTopProducts(Integer days, Integer limit) {
        int safeDays = normalizeDays(days);
        int safeLimit = (limit == null || limit < 1) ? 5 : Math.min(limit, 20);
        return orderRepository.findTopProductsByDate(calculateStartDate(safeDays)).stream()
                .limit(safeLimit)
                .map(row -> new DashboardDTO.TopProduct(
                        row[0] != null ? row[0].toString() : "Khong xac dinh",
                        row[1] != null ? ((Number) row[1]).longValue() : 0L,
                        row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO))
                .toList();
    }

    public List<DashboardDTO.CategorySales> getCategorySales(Integer days) {
        BigDecimal revenue = defaultZero(orderRepository.sumTotalRevenueSince(calculateStartDate(normalizeDays(days))));
        return List.of(new DashboardDTO.CategorySales("Tat ca san pham", revenue));
    }

    private int normalizeDays(Integer days) {
        return (days == null || days < 1) ? 7 : Math.min(days, 365);
    }

    private LocalDateTime calculateStartDate(int days) {
        return LocalDate.now().minusDays(days - 1L).atStartOfDay();
    }

    private BigDecimal defaultZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal toPercentage(long numerator, long denominator) {
        if (denominator <= 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(numerator)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(denominator), 1, RoundingMode.HALF_UP);
    }

    private BigDecimal toPercentageChange(BigDecimal currentValue, BigDecimal previousValue) {
        BigDecimal safeCurrent = defaultZero(currentValue);
        BigDecimal safePrevious = defaultZero(previousValue);
        if (safePrevious.compareTo(BigDecimal.ZERO) == 0) {
            return safeCurrent.compareTo(BigDecimal.ZERO) > 0 ? BigDecimal.valueOf(100) : BigDecimal.ZERO;
        }
        return safeCurrent.subtract(safePrevious)
                .multiply(BigDecimal.valueOf(100))
                .divide(safePrevious, 1, RoundingMode.HALF_UP);
    }

    private String resolveDirection(BigDecimal currentValue, BigDecimal previousValue) {
        int compareResult = defaultZero(currentValue).compareTo(defaultZero(previousValue));
        if (compareResult > 0) {
            return "UP";
        }
        if (compareResult < 0) {
            return "DOWN";
        }
        return "FLAT";
    }

    private DashboardDTO.MonthlyComparison buildMonthlyRevenueComparison() {
        LocalDate currentMonthStart = LocalDate.now().withDayOfMonth(1);
        LocalDate nextMonthStart = currentMonthStart.plusMonths(1);
        LocalDate previousMonthStart = currentMonthStart.minusMonths(1);
        BigDecimal previousRevenue = defaultZero(orderRepository.sumCompletedRevenueBetween(
                previousMonthStart.atStartOfDay(), currentMonthStart.atStartOfDay()));
        BigDecimal currentRevenue = defaultZero(orderRepository.sumCompletedRevenueBetween(
                currentMonthStart.atStartOfDay(), nextMonthStart.atStartOfDay()));
        BigDecimal differenceValue = currentRevenue.subtract(previousRevenue);
        return new DashboardDTO.MonthlyComparison(
                previousMonthStart.format(MONTH_LABEL_FORMATTER),
                currentMonthStart.format(MONTH_LABEL_FORMATTER),
                previousRevenue,
                currentRevenue,
                differenceValue,
                toPercentageChange(currentRevenue, previousRevenue),
                resolveDirection(currentRevenue, previousRevenue));
    }

    private List<DashboardDTO.RecentOrder> mapRecentOrders(List<Order> orders) {
        return orders.stream()
                .map(o -> new DashboardDTO.RecentOrder(
                        o.getId(),
                        o.getCustomerName() != null ? o.getCustomerName() : "Khach le",
                        o.getFinalAmount() != null ? o.getFinalAmount() : o.getTotalAmount(),
                        o.getStatus(),
                        o.getCreatedAt() != null ? o.getCreatedAt().toString() : null))
                .toList();
    }

    private List<DashboardDTO.ChartData> buildRevenueChart(LocalDateTime startDate, int days) {
        Map<String, DashboardDTO.ChartData> dataByDate = new HashMap<>();
        for (Object[] row : orderRepository.findRevenueAndOrderCountByDate(startDate)) {
            String date = row[0] != null ? row[0].toString() : "";
            long orderCount = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            long cancelledOrderCount = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            BigDecimal revenue = row[3] != null ? (BigDecimal) row[3] : BigDecimal.ZERO;
            dataByDate.put(date, new DashboardDTO.ChartData(date, revenue, orderCount, cancelledOrderCount));
        }

        List<DashboardDTO.ChartData> chartData = new ArrayList<>();
        LocalDate current = startDate.toLocalDate();
        LocalDate today = LocalDate.now();
        while (!current.isAfter(today) && chartData.size() < days) {
            String dateKey = current.toString();
            chartData.add(dataByDate.getOrDefault(dateKey, new DashboardDTO.ChartData(dateKey, BigDecimal.ZERO, 0L, 0L)));
            current = current.plusDays(1);
        }
        return chartData;
    }

    private List<DashboardDTO.StatusCount> buildOrderStatusChart(LocalDateTime startDate) {
        return List.of(
                new DashboardDTO.StatusCount("PENDING",
                        orderRepository.countByStatusAndCreatedAtGreaterThanEqual("PENDING", startDate)),
                new DashboardDTO.StatusCount("COMPLETED",
                        orderRepository.countByStatusAndCreatedAtGreaterThanEqual("COMPLETED", startDate)),
                new DashboardDTO.StatusCount("CANCELLED",
                        orderRepository.countByStatusAndCreatedAtGreaterThanEqual("CANCELLED", startDate)));
    }

    private List<DashboardDTO.RiskPoint> buildStockRiskChart(
            List<StockSummaryDTO> stockSummary,
            List<BatchExpiryDTO> batchExpiry,
            long expiringBatches7Days) {
        return List.of(
                new DashboardDTO.RiskPoint("Het hang", stockSummary.stream()
                        .filter(item -> "OUT_OF_STOCK".equalsIgnoreCase(item.getStatus()))
                        .count()),
                new DashboardDTO.RiskPoint("Ton thap", stockSummary.stream()
                        .filter(item -> "LOW_STOCK".equalsIgnoreCase(item.getStatus()))
                        .count()),
                new DashboardDTO.RiskPoint("Can HSD", stockSummary.stream()
                        .filter(item -> "NEAR_EXPIRY".equalsIgnoreCase(item.getStatus()))
                        .count()),
                new DashboardDTO.RiskPoint("HSD <= 7 ngay", expiringBatches7Days),
                new DashboardDTO.RiskPoint("Da het han", countBatchesByStatus(batchExpiry, "EXPIRED")));
    }

    private List<DashboardDTO.LowStockAlert> buildLowStockAlerts(List<StockSummaryDTO> stockSummary) {
        return stockSummary.stream()
                .filter(item -> "LOW_STOCK".equalsIgnoreCase(item.getStatus())
                        || "OUT_OF_STOCK".equalsIgnoreCase(item.getStatus()))
                .sorted(Comparator.comparingInt(item -> item.getTotalQuantity() != null ? item.getTotalQuantity() : 0))
                .limit(5)
                .map(item -> new DashboardDTO.LowStockAlert(
                        item.getProductId(),
                        item.getProductName(),
                        item.getSku(),
                        item.getTotalQuantity(),
                        item.getStatus(),
                        item.getNearestExpiryDate()))
                .toList();
    }

    private List<DashboardDTO.ExpiringBatchAlert> buildExpiringBatchAlerts(List<BatchExpiryDTO> batchExpiry) {
        return batchExpiry.stream()
                .filter(batch -> "EXPIRING_SOON".equalsIgnoreCase(batch.getStatus())
                        || "EXPIRED".equalsIgnoreCase(batch.getStatus()))
                .sorted(Comparator.comparingInt(batch -> batch.getDaysUntilExpiry() != null
                        ? batch.getDaysUntilExpiry()
                        : Integer.MAX_VALUE))
                .limit(5)
                .map(batch -> new DashboardDTO.ExpiringBatchAlert(
                        batch.getBatchId(),
                        batch.getBatchCode(),
                        batch.getProductName(),
                        batch.getSku(),
                        batch.getQuantity(),
                        batch.getExpiryDate(),
                        batch.getDaysUntilExpiry(),
                        batch.getStatus()))
                .toList();
    }

    private long countBatchesExpiringWithinDays(List<BatchExpiryDTO> batches, int days) {
        return batches.stream()
                .filter(batch -> batch.getDaysUntilExpiry() != null)
                .filter(batch -> batch.getDaysUntilExpiry() >= 0 && batch.getDaysUntilExpiry() <= days)
                .count();
    }

    private long countBatchesByStatus(List<BatchExpiryDTO> batches, String status) {
        return batches.stream()
                .filter(batch -> status.equalsIgnoreCase(batch.getStatus()))
                .count();
    }
}
