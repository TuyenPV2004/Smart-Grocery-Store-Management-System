package com.grocery.management.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    private Long productId;
    private String productSku;
    private String productName;
    private String productUnit;
    private String productBrand;
    private String productThumbnail;
    private Long supplierId;
    private String supplierCode;
    private String supplierName;
    private Integer quantity;
    private Integer initialQuantity;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private BigDecimal importPrice;
    private Long inventoryNoteId;
    private String inventoryNoteCode;
    private Integer conversionRate;
    private String importUnit;
    private Integer quantityInImportUnit;
    private Integer stockInImportUnit;

    @Version
    private Long version;

    @Transient
    public ProductView getProduct() {
        return new ProductView(productId, productSku, productName, productUnit, productBrand, productThumbnail, getTotalProductStock());
    }

    @Transient
    public SupplierView getSupplier() {
        return supplierId == null ? null : new SupplierView(supplierId, supplierCode, supplierName);
    }

    @Transient
    public InventoryNoteView getInventoryNote() {
        return inventoryNoteId == null ? null : new InventoryNoteView(inventoryNoteId, inventoryNoteCode);
    }

    private Integer getTotalProductStock() {
        return stockInImportUnit != null ? stockInImportUnit : quantity;
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
        private Integer stockQuantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupplierView {
        private Long id;
        private String code;
        private String vietnameseName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryNoteView {
        private Long id;
        private String code;
    }
}
