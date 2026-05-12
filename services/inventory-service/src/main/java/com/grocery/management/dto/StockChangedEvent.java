package com.grocery.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockChangedEvent {
    private String eventId;
    private Long productId;
    private String sku;
    private String productName;
    private Integer quantityDelta;
    private Integer currentQuantity;
    private String sourceType;
    private Long sourceId;
    private Instant occurredAt;
}
