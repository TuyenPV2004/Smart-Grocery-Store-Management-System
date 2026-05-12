package com.grocery.management.dto;

import java.math.BigDecimal;

public record ProductSnapshot(
        Long id,
        String name,
        String thumbnail,
        BigDecimal sellPrice
) {
}
