package com.grocery.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDTO {
    private BigDecimal totalRevenue;
    private long totalOrders;
    private long totalProducts;
    private long lowStockProducts;
    private long pendingOrders;
    private long cancelledOrders;
    private long expiringBatches7Days;
    private long expiringBatches30Days;
    private BigDecimal stockValue;
    private BigDecimal averageOrderValue;
    private BigDecimal cancellationRate;
    private BigDecimal vnPaySuccessRate;
    private MonthlyComparison monthlyRevenueComparison;

    private List<ChartData> revenueChart;
    private List<StatusCount> orderStatusChart;
    private List<RiskPoint> stockRiskChart;
    private List<TopProduct> topProducts;
    private List<CategorySales> categorySales;
    private List<RecentOrder> recentOrders;
    private List<RecentOrder> pendingOrderAlerts;
    private List<LowStockAlert> lowStockAlerts;
    private List<ExpiringBatchAlert> expiringBatchAlerts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartData {
        private String date;
        private BigDecimal value;
        private long orderCount;
        private long cancelledOrderCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyComparison {
        private String previousMonthLabel;
        private String currentMonthLabel;
        private BigDecimal previousRevenue;
        private BigDecimal currentRevenue;
        private BigDecimal differenceValue;
        private BigDecimal changePercent;
        private String direction;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusCount {
        private String status;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskPoint {
        private String label;
        private long value;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopProduct {
        private String productName;
        private long soldQuantity;
        private BigDecimal revenue;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategorySales {
        private String categoryName;
        private BigDecimal revenue;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentOrder {
        private Long id;
        private String customerName;
        private BigDecimal totalAmount;
        private String status;
        private String createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LowStockAlert {
        private Long productId;
        private String productName;
        private String sku;
        private Integer quantity;
        private String status;
        private LocalDate nearestExpiryDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpiringBatchAlert {
        private Long batchId;
        private String batchCode;
        private String productName;
        private String sku;
        private Integer quantity;
        private LocalDate expiryDate;
        private Integer daysUntilExpiry;
        private String status;
    }
}
