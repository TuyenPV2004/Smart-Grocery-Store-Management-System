package com.grocery.management.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.grocery.management.dto.InventoryNoteRequest;
import com.grocery.management.service.InventoryService;
import com.grocery.management.entity.InventoryNote; // Thêm import
import com.grocery.management.entity.InventoryType;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    // ... (Giữ nguyên các API createNote, getAllNotes, deleteNote)
    @PostMapping("/import")
    public ResponseEntity<?> createNote(@RequestBody InventoryNoteRequest request) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        request.setType(InventoryType.IMPORT);
        return ResponseEntity.ok(inventoryService.createImportNote(request, currentUsername));
    }

    @GetMapping
    public ResponseEntity<List<InventoryNote>> getAllNotes() {
        return ResponseEntity.ok(inventoryService.getAllNotes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryNote> getNoteDetail(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getNoteById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable Long id) {
        try {
            inventoryService.deleteNote(id);
            return ResponseEntity.ok("Xóa phiếu thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/{id}/export")
    public ResponseEntity<InputStreamResource> exportExcel(@PathVariable Long id) throws IOException {
        InventoryNote note = inventoryService.getNoteById(id);
        String fileName = note.getCode() + ".xlsx"; 
        ByteArrayInputStream in = inventoryService.exportToExcel(id);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=" + fileName);

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }
    @PostMapping("/export")
    public ResponseEntity<?> createExportNote(@RequestBody InventoryNoteRequest request) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            InventoryNote note = inventoryService.createExportNote(request, username);
            return ResponseEntity.ok(note);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}