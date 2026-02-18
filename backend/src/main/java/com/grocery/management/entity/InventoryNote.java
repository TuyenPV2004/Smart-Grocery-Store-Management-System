package com.grocery.management.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

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

    @ManyToOne
    @JoinColumn(name = "supplier_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Supplier supplier;

    @ManyToOne
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password", "roles" })
    private User createdBy;

    private BigDecimal totalAmount;
    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "inventoryNote", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<InventoryNoteDetail> details;

    @Column(name = "import_date")
    private LocalDateTime importDate;

    @Enumerated(EnumType.STRING)
    private InventoryStatus status;
    private BigDecimal discount = BigDecimal.ZERO;
    private BigDecimal vat = BigDecimal.ZERO;
    private BigDecimal finalAmount = BigDecimal.ZERO;
    private BigDecimal amountPaid = BigDecimal.ZERO;

    // Export-specific fields
    private String customerName; // For export sales
    private String exportReason; // Reason: Sales, Disposal, Internal Use, Return

    private String paymentStatus;
}