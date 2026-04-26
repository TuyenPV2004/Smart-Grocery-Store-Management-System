package com.grocery.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ProductSnapshotResponse {
    private Long id;
    private String sku;
    private String name;
    private String unit;
    private BigDecimal sellPrice;
    private String thumbnail;
    private String status;
}
