package com.grocery.management.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(InventoryException.class)
    public ResponseEntity<InventoryErrorResponse> handleInventoryException(
            InventoryException ex,
            HttpServletRequest request) {
        return ResponseEntity.status(ex.getStatus())
                .body(response(ex.getCode(), ex.getMessage(), request));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<InventoryErrorResponse> handleUnreadableMessage(
            HttpMessageNotReadableException ex,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(response("MALFORMED_JSON", "Request body khong hop le", request));
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<InventoryErrorResponse> handleOptimisticLock(
            ObjectOptimisticLockingFailureException ex,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(response("INVENTORY_CONCURRENT_UPDATE", "Du lieu ton kho vua duoc cap nhat, vui long thu lai", request));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<InventoryErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException ex,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(response("INVENTORY_DATA_CONFLICT", "Du lieu inventory bi trung hoac vi pham rang buoc", request));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<InventoryErrorResponse> handleUnexpectedException(
            Exception ex,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response("INTERNAL_ERROR", "Loi he thong inventory-service", request));
    }

    private InventoryErrorResponse response(String code, String message, HttpServletRequest request) {
        return new InventoryErrorResponse(code, message, request.getRequestURI(), Instant.now());
    }
}
