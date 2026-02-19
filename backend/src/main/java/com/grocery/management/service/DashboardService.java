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

    public DashboardDTO getDashboardStats() {
        // Summary Stats
        BigDecimal totalRevenue = orderRepository.sumTotalRevenue();
        if (totalRevenue == null)
            totalRevenue = BigDecimal.ZERO;
        long totalOrders = orderRepository.countCompletedOrders();
        long totalProducts = productRepository.count();
        long lowStockProducts = productRepository.countLowStock();

        // Chart Data (Last 7 days)
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<Object[]> revenueData = orderRepository.findRevenueByDate(sevenDaysAgo);
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

        // Top Products (Placeholder for now as we don't have order details aggregation
        // in OrderRepository yet)
        List<DashboardDTO.TopProduct> topProducts = new ArrayList<>();
        // In a real app, query order_details grouped by product_id

        return DashboardDTO.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalProducts(totalProducts)
                .lowStockProducts(lowStockProducts)
                .revenueChart(chartData)
                .recentOrders(recentOrders)
                .topProducts(topProducts)
                .build();
    }
}
