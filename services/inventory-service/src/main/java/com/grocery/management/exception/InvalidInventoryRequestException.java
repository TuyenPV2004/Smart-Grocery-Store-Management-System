package com.grocery.management.exception;

import org.springframework.http.HttpStatus;

public class InvalidInventoryRequestException extends InventoryException {
    public InvalidInventoryRequestException(String message) {
        super("INVALID_INVENTORY_REQUEST", HttpStatus.BAD_REQUEST, message);
    }
}
