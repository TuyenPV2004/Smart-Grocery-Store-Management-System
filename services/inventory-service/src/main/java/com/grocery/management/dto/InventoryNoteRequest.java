package com.grocery.management.dto;

import com.grocery.management.entity.InventoryType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class InventoryNoteRequest {
    private InventoryType type;
    private Long supplierId;
    private String note;
    private String reason;
    private LocalDateTime transactionDate;
    private String code;
    private BigDecimal discount = BigDecimal.ZERO;
    private BigDecimal vat = BigDecimal.ZERO;
    private BigDecimal amountPaid = BigDecimal.ZERO;
    private String customerName;
    private String exportReason;
    private List<InventoryNoteDetailDto> details;

    @Data
    public static class InventoryNoteDetailDto {
        private Long productId;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal itemDiscount = BigDecimal.ZERO;
        private LocalDate expiryDate;
        private String sku;
        private String importUnit;
        private Integer conversionRate;
        private BigDecimal importPrice;
        private String origin;
        private LocalDate manufacturingDate;
        private String batchCode;
    }
}
