package com.grocery.management.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.grocery.management.dto.ProductSnapshot;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "promotions")
@Data
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "discount_type", nullable = false)
    private String discountType;

    @Column(name = "discount_value", nullable = false)
    private BigDecimal discountValue;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    @Column(name = "start_date", nullable = false, columnDefinition = "DATETIME")
    private LocalDateTime startDate;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm")
    @Column(name = "end_date", nullable = false, columnDefinition = "DATETIME")
    private LocalDateTime endDate;

    @Column(length = 20)
    private String status = "ACTIVE";

    @ElementCollection
    @CollectionTable(name = "promotion_products", joinColumns = @JoinColumn(name = "promotion_id"))
    @Column(name = "product_id")
    private Set<Long> productIds = new HashSet<>();

    @Transient
    private List<ProductSnapshot> products = new ArrayList<>();

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
