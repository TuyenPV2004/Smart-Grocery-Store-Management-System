package com.grocery.management.repository;

import com.grocery.management.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query(value = "SELECT SUM(o.total_amount) FROM orders o WHERE o.status = 'COMPLETED'", nativeQuery = true)
    java.math.BigDecimal sumTotalRevenue();

    @Query(value = "SELECT COUNT(*) FROM orders o WHERE o.status = 'COMPLETED'", nativeQuery = true)
    long countCompletedOrders();

    @Query(value = "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, SUM(total_amount) as revenue FROM orders WHERE status = 'COMPLETED' AND created_at >= :startDate GROUP BY date ORDER BY date", nativeQuery = true)
    List<Object[]> findRevenueByDate(java.time.LocalDateTime startDate);

    @Query("""
            SELECT od.product.name, SUM(od.quantity), COALESCE(SUM(od.totalLine), 0)
            FROM OrderDetail od
            WHERE od.order.status = 'COMPLETED'
                AND od.order.createdAt >= :startDate
            GROUP BY od.product.id, od.product.name
            ORDER BY SUM(od.quantity) DESC
            """)
    List<Object[]> findTopProductsByDate(LocalDateTime startDate);

    @Query("""
            SELECT COALESCE(c.name, 'Chua phan loai'), COALESCE(SUM(od.totalLine), 0)
            FROM OrderDetail od
            LEFT JOIN od.product.labels c
            WHERE od.order.status = 'COMPLETED'
                AND od.order.createdAt >= :startDate
            GROUP BY c.id, c.name
            ORDER BY COALESCE(SUM(od.totalLine), 0) DESC
            """)
    List<Object[]> findCategorySalesByDate(LocalDateTime startDate);

    List<Order> findTop5ByOrderByCreatedAtDesc();

    List<Order> findByUserUsernameOrderByCreatedAtDesc(String username);

    java.util.Optional<Order> findByIdAndUserUsername(Long id, String username);
}