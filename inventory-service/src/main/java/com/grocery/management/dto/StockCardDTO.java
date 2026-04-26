package com.grocery.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class StockCardDTO {
    private LocalDateTime transactionDate;
    private String transactionType;
    private String noteCode;
    private String description;
    private Integer quantityChange;
    private Integer runningBalance;
    private String batchCode;
}
