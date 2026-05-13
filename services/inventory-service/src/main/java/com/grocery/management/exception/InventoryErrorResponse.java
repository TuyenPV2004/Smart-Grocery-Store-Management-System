package com.grocery.management.exception;

import java.time.Instant;

public record InventoryErrorResponse(
        String code,
        String message,
        String path,
        Instant timestamp) {
}
