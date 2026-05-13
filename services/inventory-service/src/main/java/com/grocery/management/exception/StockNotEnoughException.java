package com.grocery.management.exception;

import org.springframework.http.HttpStatus;

public class StockNotEnoughException extends InventoryException {
    public StockNotEnoughException(String message) {
        super("STOCK_NOT_ENOUGH", HttpStatus.CONFLICT, message);
    }
}
