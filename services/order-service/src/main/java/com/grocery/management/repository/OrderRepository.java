package com.grocery.management.repository;

import com.grocery.management.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByCode(String code);
    Optional<Order> findByCodeAndUsername(String code, String username);
    Optional<Order> findByIdAndUsername(Long id, String username);
    List<Order> findByUsernameOrderByCreatedAtDesc(String username);
    List<Order> findTop5ByOrderByCreatedAtDesc();
    List<Order> findTop5ByStatusOrderByCreatedAtDesc(String status);
    long countByStatus(String status);
    long countByCreatedAtGreaterThanEqual(LocalDateTime startDate);
    long countByStatusAndCreatedAtGreaterThanEqual(String status, LocalDateTime startDate);
    long countByPaymentMethodAndCreatedAtGreaterThanEqual(String paymentMethod, LocalDateTime startDate);
    long countByPaymentMethodAndPaymentStatusAndCreatedAtGreaterThanEqual(String paymentMethod, String paymentStatus, LocalDateTime startDate);

    @Query("""
            SELECT o FROM Order o
            WHERE o.username = :username
               OR (o.username IS NULL AND o.userId = :userId)
            ORDER BY o.createdAt DESC
            """)
    List<Order> findForUser(@Param("username") String username, @Param("userId") Long userId);

    @Query("""
            SELECT o FROM Order o
            WHERE o.code = :code
              AND (o.username = :username OR (o.username IS NULL AND o.userId = :userId))
            """)
    Optional<Order> findByCodeForUser(@Param("code") String code, @Param("username") String username, @Param("userId") Long userId);

    @Query("""
            SELECT o FROM Order o
            WHERE o.id = :id
              AND (o.username = :username OR (o.username IS NULL AND o.userId = :userId))
            """)
    Optional<Order> findByIdForUser(@Param("id") Long id, @Param("username") String username, @Param("userId") Long userId);

    List<Order> findByPaymentStatusAndPaymentExpiresAtBefore(String paymentStatus, LocalDateTime dateTime);

    @Query("""
            SELECT COALESCE(SUM(o.finalAmount), 0)
            FROM Order o
            WHERE o.status = 'COMPLETED'
              AND o.createdAt >= :startDate
            """)
    BigDecimal sumTotalRevenueSince(@Param("startDate") LocalDateTime startDate);

    @Query("""
            SELECT COALESCE(SUM(o.finalAmount), 0)
            FROM Order o
            WHERE o.status = 'COMPLETED'
              AND o.createdAt >= :startDate
              AND o.createdAt < :endDate
            """)
    BigDecimal sumCompletedRevenueBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("""
            SELECT FUNCTION('DATE', o.createdAt), COUNT(o), SUM(CASE WHEN o.status = 'CANCELLED' THEN 1 ELSE 0 END),
                   COALESCE(SUM(CASE WHEN o.status = 'COMPLETED' THEN o.finalAmount ELSE 0 END), 0)
            FROM Order o
            WHERE o.createdAt >= :startDate
            GROUP BY FUNCTION('DATE', o.createdAt)
            ORDER BY FUNCTION('DATE', o.createdAt)
            """)
    List<Object[]> findRevenueAndOrderCountByDate(@Param("startDate") LocalDateTime startDate);

    @Query("""
            SELECT d.productName, SUM(d.quantity), COALESCE(SUM(d.totalLine), 0)
            FROM OrderDetail d
            JOIN d.order o
            WHERE o.status = 'COMPLETED'
              AND o.createdAt >= :startDate
            GROUP BY d.productName
            ORDER BY SUM(d.quantity) DESC
            """)
    List<Object[]> findTopProductsByDate(@Param("startDate") LocalDateTime startDate);
}
