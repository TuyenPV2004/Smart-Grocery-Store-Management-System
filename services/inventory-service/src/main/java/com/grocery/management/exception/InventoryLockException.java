package com.grocery.management.exception;

import org.springframework.http.HttpStatus;

public class InventoryLockException extends InventoryException {
    public InventoryLockException(String message) {
        super("INVENTORY_LOCK_UNAVAILABLE", HttpStatus.CONFLICT, message);
    }

    public InventoryLockException(String message, Throwable cause) {
        super("INVENTORY_LOCK_UNAVAILABLE", HttpStatus.CONFLICT, message, cause);
    }
}
