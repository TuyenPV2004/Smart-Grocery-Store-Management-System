package com.grocery.management.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
@Data
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String slug;

    private String label; // Tên hiển thị trên nhãn (Ví dụ: HOT, NEW)
    private String labelColor;
    private String color;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "home_featured")
    private Boolean homeFeatured = false;

    @Column(name = "home_display_order")
    private Integer homeDisplayOrder;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE; // Dùng lại Enum Status của bạn

    // Quan hệ với cha (Nhiều con thuộc 1 cha)
    @ManyToOne
    @JoinColumn(name = "parent_id")
    @JsonBackReference // Ngắt vòng lặp JSON khi serialize
    @ToString.Exclude
    private Category parent;

    // Quan hệ với con (1 cha có nhiều con)
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    @JsonManagedReference // Cho phép serialize list con
    private List<Category> children = new ArrayList<>();
}
