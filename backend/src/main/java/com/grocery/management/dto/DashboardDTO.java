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

    private List<ChartData> revenueChart;
    private List<TopProduct> topProducts;
    private List<CategorySales> categorySales;
    private List<RecentOrder> recentOrders;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartData {
        private String date; // Or LocalDate
        private BigDecimal value;
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
}
