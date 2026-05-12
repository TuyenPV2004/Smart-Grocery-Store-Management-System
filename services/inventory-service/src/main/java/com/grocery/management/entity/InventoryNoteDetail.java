package com.grocery.management.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "inventory_note_details")
@Data
public class InventoryNoteDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    @JsonBackReference
    private InventoryNote inventoryNote;

    private Long productId;
    private String productSku;
    private String productName;
    private String productUnit;
    private String productBrand;
    private String productThumbnail;
    private int quantity;
    private int quantityInImportUnit;
    private String importUnit;
    private int conversionRate;
    private BigDecimal importPrice;
    private BigDecimal actualPrice;
    private BigDecimal itemDiscount;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private String batchCode;
    private String origin;

    @Transient
    public ProductView getProduct() {
        return new ProductView(productId, productSku, productName, productUnit, productBrand, productThumbnail);
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductView {
        private Long id;
        private String sku;
        private String name;
        private String unit;
        private String brand;
        private String thumbnail;
    }
}
