package com.grocery.management.repository;

import com.grocery.management.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query(value = "SELECT SUM(o.total_amount) FROM orders o WHERE o.status = 'COMPLETED'", nativeQuery = true)
    java.math.BigDecimal sumTotalRevenue();

    @Query(value = "SELECT COUNT(*) FROM orders o WHERE o.status = 'COMPLETED'", nativeQuery = true)
    long countCompletedOrders();

    @Query(value = "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, SUM(total_amount) as revenue FROM orders WHERE status = 'COMPLETED' AND created_at >= :startDate GROUP BY date ORDER BY date", nativeQuery = true)
    List<Object[]> findRevenueByDate(java.time.LocalDateTime startDate);

    List<Order> findTop5ByOrderByCreatedAtDesc();
}