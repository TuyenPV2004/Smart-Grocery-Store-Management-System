package com.grocery.management.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class StockSummaryDTO {
    private Long productId;
    private String productName;
    private String sku;
    private Integer totalQuantity;
    private LocalDate nearestExpiryDate;
    private BigDecimal stockValue;
    private String status;
}
