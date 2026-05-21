package com.grocery.management.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "suppliers")
@Data
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code; 

    @Column(name = "vietnamese_name", nullable = false)
    private String vietnameseName; 

    @Column(name = "english_name")
    private String englishName;    

    @Column(name = "trading_name")
    private String tradingName;    

    private String brand;          
    @Column(nullable = false, unique = true)
    private String phone;

    private String email;
    private String address;

    @Column(name = "logo_url")
    private String logoUrl;
    
    @Column(name = "tax_code")
    private String taxCode;
    
    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "current_debt")
    private BigDecimal currentDebt = BigDecimal.ZERO; 

}
