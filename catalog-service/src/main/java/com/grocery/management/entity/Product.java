package com.grocery.management.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "products")
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 350)
    private String name;

    private String brand;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, unique = true)
    private String sku;

    @Column(nullable = false, unique = true, length = 100)
    private String barcode;

    @Column(length = 500)
    private String thumbnail;

    @Column(nullable = false)
    private String unit;

    @Column(name = "import_price", nullable = false)
    private BigDecimal importPrice;

    @Column(name = "sell_price")
    private BigDecimal sellPrice;

    @Enumerated(EnumType.STRING)
    private ProductStatus status;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Supplier supplier;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity = 0;

    @Column(name = "min_stock")
    private Integer minStock = 0;
    private String location;

    @Column(name = "shelf_life")
    private Integer shelfLife;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "product_labels", joinColumns = @JoinColumn(name = "product_id"), inverseJoinColumns = @JoinColumn(name = "label_id"))
    private java.util.Set<Category> labels = new java.util.HashSet<>();

    @Transient
    private Map<String, Object> activePromotion;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ProductImage> images = new java.util.ArrayList<>();
}
