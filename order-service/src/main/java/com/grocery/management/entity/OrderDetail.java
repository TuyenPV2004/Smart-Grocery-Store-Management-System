package com.grocery.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

@Entity
@Table(name = "order_details")
@Data
public class OrderDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    @JsonIgnore
    private Order order;

    private Long productId;
    private String productSku;
    private String productName;
    private String productUnit;
    private String productThumbnail;
    private String productStatus;
    private int quantity;
    private BigDecimal price;
    private BigDecimal totalLine;

    @Transient
    public ProductView getProduct() {
        return new ProductView(productId, productSku, productName, productUnit, productThumbnail, productStatus);
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductView {
        private Long id;
        private String sku;
        private String name;
        private String unit;
        private String thumbnail;
        private String status;
    }
}
