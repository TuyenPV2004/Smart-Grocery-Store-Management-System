package com.grocery.management.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductSnapshotResponse {
    private Long id;
    private String sku;
    private String name;
    private String unit;
    private BigDecimal sellPrice;
    private String thumbnail;
    private String status;
}
