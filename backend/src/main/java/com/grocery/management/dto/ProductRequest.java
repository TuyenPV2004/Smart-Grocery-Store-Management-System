package com.grocery.management.dto;

import com.grocery.management.entity.ProductStatus;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequest {
    private String name;
    private String barcode;
    private String description;
    private BigDecimal sellPrice;
    private BigDecimal importPrice;
    private Integer minStockLevel;
    private Long supplierId;
    private String image;
    private ProductStatus status;
    private String sku;
    private Integer shelfLife;
}