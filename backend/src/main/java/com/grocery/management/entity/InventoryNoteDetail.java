package com.grocery.management.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonBackReference; // 1. Thêm Import

@Entity
@Table(name = "inventory_note_details")
@Data
public class InventoryNoteDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "note_id", nullable = false)
    @JsonBackReference
    private InventoryNote inventoryNote;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private int quantity;
    @Column(name = "quantity_in_import_unit")
    private int quantityInImportUnit;

    @Column(name = "import_unit")
    private String importUnit;

    @Column(name = "conversion_rate")
    private int conversionRate;

    @Column(name = "import_price")
    private BigDecimal importPrice;

    @Column(name = "actual_price")
    private BigDecimal actualPrice; 
    
    @Column(name = "item_discount")
    private BigDecimal itemDiscount;

    @Column(name = "manufacturing_date")
    private LocalDate manufacturingDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "batch_code")
    private String batchCode;

    private String origin;
}