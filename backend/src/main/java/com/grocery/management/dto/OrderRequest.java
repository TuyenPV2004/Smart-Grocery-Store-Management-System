package com.grocery.management.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderRequest {
    private String customerName;
    private String customerPhone;
    private String paymentMethod;
    private BigDecimal discount;
    private String voucherCode;
    private List<OrderItem> items;

    @Data
    public static class OrderItem {
        private Long productId;
        private int quantity;
        private BigDecimal price;
    }
}