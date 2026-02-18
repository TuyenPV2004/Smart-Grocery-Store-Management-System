package com.grocery.management.dto;

import java.time.LocalDateTime;

public class StockCardDTO {
    private LocalDateTime transactionDate;
    private String transactionType; // IMPORT, EXPORT
    private String noteCode;
    private String description;
    private Integer quantityChange;
    private Integer runningBalance;
    private String batchCode;

    // Constructor for JPQL
    public StockCardDTO(LocalDateTime transactionDate, String transactionType,
            String noteCode, String description, Integer quantityChange, String batchCode) {
        this.transactionDate = transactionDate;
        this.transactionType = transactionType;
        this.noteCode = noteCode;
        this.description = description;
        this.quantityChange = quantityChange;
        this.batchCode = batchCode;
        this.runningBalance = 0; // Will be calculated in service
    }

    // Getters and Setters
    public LocalDateTime getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDateTime transactionDate) {
        this.transactionDate = transactionDate;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public String getNoteCode() {
        return noteCode;
    }

    public void setNoteCode(String noteCode) {
        this.noteCode = noteCode;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getQuantityChange() {
        return quantityChange;
    }

    public void setQuantityChange(Integer quantityChange) {
        this.quantityChange = quantityChange;
    }

    public Integer getRunningBalance() {
        return runningBalance;
    }

    public void setRunningBalance(Integer runningBalance) {
        this.runningBalance = runningBalance;
    }

    public String getBatchCode() {
        return batchCode;
    }

    public void setBatchCode(String batchCode) {
        this.batchCode = batchCode;
    }
}
