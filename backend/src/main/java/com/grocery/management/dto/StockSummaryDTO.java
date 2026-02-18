package com.grocery.management.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class StockSummaryDTO {
    private Long productId;
    private String sku;
    private String productName;
    private String unit;
    private String category;
    private Integer totalQuantity;
    private BigDecimal stockValue;
    private String status; // OUT_OF_STOCK, LOW_STOCK, NEAR_EXPIRY, NORMAL
    private LocalDate nearestExpiryDate;
    private String brand;

    private Long totalImported;
    private Long totalExported;

    // Constructor for JPQL (Old constructor kept for compatibility if needed, but
    // usually replaced)
    // Updated constructor
    private String thumbnail;

    public StockSummaryDTO(Long productId, String sku, String productName, String unit,
            String category, Long totalQuantity, BigDecimal stockValue,
            LocalDate nearestExpiryDate, String brand, String thumbnail) {
        this.productId = productId;
        this.sku = sku;
        this.productName = productName;
        this.unit = unit;
        this.category = category;
        this.totalQuantity = totalQuantity != null ? totalQuantity.intValue() : 0;
        this.stockValue = stockValue != null ? stockValue : BigDecimal.ZERO;
        this.nearestExpiryDate = nearestExpiryDate;
        this.brand = brand;
        this.thumbnail = thumbnail;
        this.status = "NORMAL";
        this.totalImported = 0L;
        this.totalExported = 0L;
    }

    // Getters and Setters
    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(Integer totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public BigDecimal getStockValue() {
        return stockValue;
    }

    public void setStockValue(BigDecimal stockValue) {
        this.stockValue = stockValue;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getNearestExpiryDate() {
        return nearestExpiryDate;
    }

    public void setNearestExpiryDate(LocalDate nearestExpiryDate) {
        this.nearestExpiryDate = nearestExpiryDate;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public Long getTotalImported() {
        return totalImported;
    }

    public void setTotalImported(Long totalImported) {
        this.totalImported = totalImported;
    }

    public Long getTotalExported() {
        return totalExported;
    }

    public void setTotalExported(Long totalExported) {
        this.totalExported = totalExported;
    }

    private Integer conversionRate;

    public void setConversionRate(Integer conversionRate) {
        this.conversionRate = conversionRate;
    }

    public Integer getConversionRate() {
        return conversionRate != null ? conversionRate : 1;
    }

    public String getThumbnail() {
        return thumbnail;
    }

    public void setThumbnail(String thumbnail) {
        this.thumbnail = thumbnail;
    }
}
