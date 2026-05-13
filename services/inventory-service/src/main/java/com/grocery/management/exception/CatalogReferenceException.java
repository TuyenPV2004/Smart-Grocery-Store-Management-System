package com.grocery.management.exception;

import org.springframework.http.HttpStatus;

public class CatalogReferenceException extends InventoryException {
    public CatalogReferenceException(String message) {
        super("CATALOG_REFERENCE_ERROR", HttpStatus.BAD_GATEWAY, message);
    }
}
