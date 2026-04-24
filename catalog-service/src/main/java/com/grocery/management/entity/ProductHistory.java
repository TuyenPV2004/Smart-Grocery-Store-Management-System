package com.grocery.management.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_histories")
@Data
public class ProductHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long productId;
    private String productName;
    private String sku;
    private String action; // "THÊM MỚI", "CẬP NHẬT", "XÓA"
    private String performedBy;
    private String role;
    private LocalDateTime timestamp;
}