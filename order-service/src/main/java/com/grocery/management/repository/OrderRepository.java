package com.grocery.management.repository;

import com.grocery.management.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByCode(String code);
    Optional<Order> findByCodeAndUsername(String code, String username);
    Optional<Order> findByIdAndUsername(Long id, String username);
    List<Order> findByUsernameOrderByCreatedAtDesc(String username);

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
}
