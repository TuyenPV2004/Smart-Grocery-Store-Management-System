package com.grocery.management.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;
    private Long userId;
    private String username;
    private String customerName;
    private String customerPhone;
    private String paymentMethod;
    private BigDecimal totalAmount;
    private BigDecimal discount;
    private BigDecimal finalAmount;
    private String voucherCode;
    private String status;
    private String paymentStatus;
    private String paymentTransactionNo;
    private String paymentFailureReason;
    private LocalDateTime paymentConfirmedAt;
    private LocalDateTime paymentExpiresAt;
    private boolean inventoryAllocated;
    private boolean voucherUsageCommitted;
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrderDetail> details;
}
