package com.grocery.management.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_history")
@Data
public class PriceHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "old_price", nullable = false)
    private BigDecimal oldPrice;

    @Column(name = "new_price", nullable = false)
    private BigDecimal newPrice;

    @Column(name = "changed_by", nullable = false)
    private String changedBy;

    @Column(name = "user_role", nullable = false)
    private String userRole;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_type")
    private PriceType priceType;

    public enum PriceType {
        IMPORT, SELL
    }
}
