package com.grocery.management.dto;

import lombok.Data;

import java.util.List;

@Data
public class StockReservationRequest {
    private String orderCode;
    private List<Item> items;

    @Data
    public static class Item {
        private Long productId;
        private Integer quantity;
    }
}
