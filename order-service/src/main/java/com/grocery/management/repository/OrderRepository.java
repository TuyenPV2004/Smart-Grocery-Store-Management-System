package com.grocery.management.repository;

import com.grocery.management.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByCode(String code);
    Optional<Order> findByCodeAndUsername(String code, String username);
    Optional<Order> findByIdAndUsername(Long id, String username);
    List<Order> findByUsernameOrderByCreatedAtDesc(String username);
    List<Order> findByPaymentStatusAndPaymentExpiresAtBefore(String paymentStatus, LocalDateTime dateTime);
}
