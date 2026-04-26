package com.grocery.management.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "category_histories")
@Data
public class CategoryHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "category_name")
    private String categoryName;

    private String action; 

    @Column(name = "performed_by")
    private String performedBy; // Sẽ lưu Fullname (VD: Administrator) thay vì username

    private String role; // --- BỔ SUNG MỚI ---

    private LocalDateTime timestamp;
}