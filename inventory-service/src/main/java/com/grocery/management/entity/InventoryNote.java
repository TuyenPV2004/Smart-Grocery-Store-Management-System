package com.grocery.management.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "inventory_notes")
@Data
public class InventoryNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    private InventoryType type;

    private Long supplierId;
    private String supplierCode;
    private String supplierName;
    private Long createdByUserId;
    private String createdByStaffCode;
    private String createdByUsername;
    private String createdByFullName;
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime importDate;

    @Enumerated(EnumType.STRING)
    private InventoryStatus status;

    private BigDecimal discount = BigDecimal.ZERO;
    private BigDecimal vat = BigDecimal.ZERO;
    private BigDecimal finalAmount = BigDecimal.ZERO;
    private BigDecimal amountPaid = BigDecimal.ZERO;
    private String customerName;
    private String exportReason;
    private String paymentStatus;

    @OneToMany(mappedBy = "inventoryNote", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<InventoryNoteDetail> details;

    @Transient
    public SupplierView getSupplier() {
        return supplierId == null ? null : new SupplierView(supplierId, supplierCode, supplierName);
    }

    @Transient
    public UserView getCreatedBy() {
        return createdByUsername == null ? null : new UserView(createdByUserId, createdByStaffCode, createdByUsername, createdByFullName);
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
    public static class UserView {
        private Long id;
        private String staffCode;
        private String username;
        private String fullName;
    }
}
