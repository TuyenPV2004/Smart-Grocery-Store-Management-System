package com.grocery.management.service;

import com.grocery.management.dto.DashboardDTO;
import com.grocery.management.entity.Order;
import com.grocery.management.repository.OrderRepository;
import com.grocery.management.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    private int normalizeDays(Integer days) {
        return (days == null || days < 1) ? 7 : Math.min(days, 365);
    }

    public DashboardDTO getDashboardStats(Integer days) {
        int safeDays = normalizeDays(days);

        // Summary Stats
        BigDecimal totalRevenue = orderRepository.sumTotalRevenue();
        if (totalRevenue == null)
            totalRevenue = BigDecimal.ZERO;
        long totalOrders = orderRepository.countCompletedOrders();
        long totalProducts = productRepository.count();
        long lowStockProducts = productRepository.countLowStock();

        // Chart Data (Selected time range)
        LocalDateTime startDate = LocalDateTime.now().minusDays(safeDays);
        List<Object[]> revenueData = orderRepository.findRevenueByDate(startDate);
        List<DashboardDTO.ChartData> chartData = new ArrayList<>();
        if (revenueData != null) {
            for (Object[] row : revenueData) {
                String date = row[0].toString();
                BigDecimal value = (BigDecimal) row[1];
                chartData.add(new DashboardDTO.ChartData(date, value));
            }
        }

        // Recent Orders
        List<Order> recentOrdersList = orderRepository.findTop5ByOrderByCreatedAtDesc();
        List<DashboardDTO.RecentOrder> recentOrders = recentOrdersList.stream()
                .map(o -> new DashboardDTO.RecentOrder(
                        o.getId(),
                        o.getCustomerName() != null ? o.getCustomerName() : "Khách lẻ",
                        o.getTotalAmount(),
                        o.getStatus(),
                        o.getCreatedAt().toString()))
                .collect(Collectors.toList());

        // Top Products
        List<DashboardDTO.TopProduct> topProducts = getTopProducts(safeDays, 5);

        // Category Sales
        List<DashboardDTO.CategorySales> categorySales = getCategorySales(safeDays);

        return DashboardDTO.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalProducts(totalProducts)
                .lowStockProducts(lowStockProducts)
                .revenueChart(chartData)
                .recentOrders(recentOrders)
                .topProducts(topProducts)
                .categorySales(categorySales)
                .build();
    }

    public List<DashboardDTO.TopProduct> getTopProducts(Integer days, Integer limit) {
        int safeDays = normalizeDays(days);
        int safeLimit = (limit == null || limit < 1) ? 5 : Math.min(limit, 20);

        LocalDateTime startDate = LocalDateTime.now().minusDays(safeDays);
        return orderRepository.findTopProductsByDate(startDate).stream()
                .limit(safeLimit)
                .map(row -> {
                    String productName = row[0] != null ? row[0].toString() : "Khong xac dinh";
                    long soldQuantity = row[1] != null ? ((Number) row[1]).longValue() : 0L;
                    BigDecimal revenue = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
                    return new DashboardDTO.TopProduct(productName, soldQuantity, revenue);
                })
                .collect(Collectors.toList());
    }

    public List<DashboardDTO.CategorySales> getCategorySales(Integer days) {
        int safeDays = normalizeDays(days);
        LocalDateTime startDate = LocalDateTime.now().minusDays(safeDays);

        return orderRepository.findCategorySalesByDate(startDate).stream()
                .map(row -> {
                    String categoryName = row[0] != null ? row[0].toString() : "Chua phan loai";
                    BigDecimal revenue = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
                    return new DashboardDTO.CategorySales(categoryName, revenue);
                })
                .collect(Collectors.toList());
    }
}
