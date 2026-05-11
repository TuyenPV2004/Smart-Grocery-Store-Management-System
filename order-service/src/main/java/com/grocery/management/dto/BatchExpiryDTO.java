package com.grocery.management.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class BatchExpiryDTO {
    private Long batchId;
    private String batchCode;
    private String productName;
    private String sku;
    private Integer quantity;
    private LocalDate expiryDate;
    private Integer daysUntilExpiry;
    private String status;
}
