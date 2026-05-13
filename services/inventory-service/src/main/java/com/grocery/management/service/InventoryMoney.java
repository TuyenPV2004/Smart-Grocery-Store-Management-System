package com.grocery.management.service;

import java.math.BigDecimal;

final class InventoryMoney {
    private InventoryMoney() {
    }

    static BigDecimal defaultMoney(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
