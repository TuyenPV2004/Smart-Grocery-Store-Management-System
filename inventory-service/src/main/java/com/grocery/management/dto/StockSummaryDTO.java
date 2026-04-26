package com.grocery.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockSummaryDTO {
    private Long productId;
    private String sku;
    private String productName;
    private String unit;
    private String category;
    private Integer totalQuantity;
    private BigDecimal stockValue;
    private String status;
    private LocalDate nearestExpiryDate;
    private String brand;
    private Long totalImported;
    private Long totalExported;
    private Integer conversionRate;
    private String thumbnail;

    public StockSummaryDTO(Long productId, String sku, String productName, String unit,
            String category, Long totalQuantity, BigDecimal stockValue,
            LocalDate nearestExpiryDate, String brand, Long totalImported,
            Long totalExported, Integer conversionRate, String thumbnail) {
        this.productId = productId;
        this.sku = sku;
        this.productName = productName;
        this.unit = unit;
        this.category = category;
        this.totalQuantity = totalQuantity != null ? totalQuantity.intValue() : 0;
        this.stockValue = stockValue != null ? stockValue : BigDecimal.ZERO;
        this.nearestExpiryDate = nearestExpiryDate;
        this.brand = brand;
        this.totalImported = totalImported != null ? totalImported : 0L;
        this.totalExported = totalExported != null ? totalExported : 0L;
        this.conversionRate = conversionRate != null ? conversionRate : 1;
        this.thumbnail = thumbnail;
    }
}
