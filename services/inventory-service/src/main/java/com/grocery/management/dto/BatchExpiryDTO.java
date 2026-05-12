package com.grocery.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class BatchExpiryDTO {
    private Long batchId;
    private String batchCode;
    private String productName;
    private String sku;
    private Integer quantity;
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;
    private String supplierName;
    private String status;
    private Integer daysUntilExpiry;
    private String origin;
}
