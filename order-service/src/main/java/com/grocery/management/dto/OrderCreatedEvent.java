package com.grocery.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class OrderCreatedEvent {
    private Long orderId;
    private String orderCode;
    private Long userId;
    private String username;
    private String customerName;
    private String customerPhone;
    private String email;
    private BigDecimal finalAmount;
    private String paymentMethod;
    private String voucherCode;
    private LocalDateTime createdAt;
}
