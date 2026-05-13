package com.grocery.management.service;

import com.grocery.management.dto.InventoryNoteRequest;

import java.util.List;

final class InventoryRequestSupport {
    private InventoryRequestSupport() {
    }

    static List<InventoryNoteRequest.InventoryNoteDetailDto> safeDetails(InventoryNoteRequest request) {
        return request.getDetails() != null ? request.getDetails() : List.of();
    }
}
