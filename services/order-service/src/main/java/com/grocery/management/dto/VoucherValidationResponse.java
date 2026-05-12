package com.grocery.management.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class VoucherValidationResponse {
    private Long id;
    private String code;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderValue;
    private BigDecimal maxDiscountAmount;
}
