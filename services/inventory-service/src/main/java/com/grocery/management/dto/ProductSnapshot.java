package com.grocery.management.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductSnapshot {
    private Long id;
    private String sku;
    private String name;
    private String unit;
    private String brand;
    private String thumbnail;
    private BigDecimal sellPrice;
    private BigDecimal importPrice;
    private Integer stockQuantity;
    private SupplierSnapshot supplier;
}
