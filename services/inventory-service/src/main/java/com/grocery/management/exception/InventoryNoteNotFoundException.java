package com.grocery.management.exception;

import org.springframework.http.HttpStatus;

public class InventoryNoteNotFoundException extends InventoryException {
    public InventoryNoteNotFoundException(String message) {
        super("INVENTORY_NOTE_NOT_FOUND", HttpStatus.NOT_FOUND, message);
    }
}
