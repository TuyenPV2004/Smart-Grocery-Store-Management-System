package com.grocery.management.exception;

import org.springframework.http.HttpStatus;

public class ProductBatchNotFoundException extends InventoryException {
    public ProductBatchNotFoundException(String message) {
        super("PRODUCT_BATCH_NOT_FOUND", HttpStatus.NOT_FOUND, message);
    }
}
