package com.grocery.management.exception;

import org.springframework.http.HttpStatus;

public class ReservationNotFoundException extends InventoryException {
    public ReservationNotFoundException(String message) {
        super("RESERVATION_NOT_FOUND", HttpStatus.NOT_FOUND, message);
    }
}
