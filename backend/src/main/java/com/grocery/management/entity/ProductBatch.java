package com.grocery.management.entity;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "product_batches")
@Data
public class ProductBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String batchCode;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Supplier supplier;

    private Integer quantity;
    private Integer initialQuantity;

    @Column(name = "manufacturing_date")
    private LocalDate manufacturingDate;

    private LocalDate expiryDate;

    private BigDecimal importPrice;

    @ManyToOne
    @JoinColumn(name = "inventory_note_id")
    @JsonIgnoreProperties(value = { "details", "supplier", "user" }, allowSetters = true)
    private InventoryNote inventoryNote;

    @Transient
    private Integer conversionRate;

    @Transient
    private String importUnit;

    @Transient
    private Integer quantityInImportUnit;

    @Transient
    private Integer stockInImportUnit;
}