package com.grocery.management.controller;

import com.grocery.management.dto.InventoryNoteRequest;
import com.grocery.management.entity.InventoryNote;
import com.grocery.management.entity.InventoryType;
import com.grocery.management.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {
    private final InventoryService inventoryService;

    @PostMapping("/import")
    public ResponseEntity<?> createNote(@RequestBody InventoryNoteRequest request, Authentication authentication) {
        request.setType(InventoryType.IMPORT);
        return ResponseEntity.ok(inventoryService.createImportNote(request, username(authentication)));
    }

    @GetMapping
    public ResponseEntity<List<InventoryNote>> getAllNotes() {
        return ResponseEntity.ok(inventoryService.getAllNotes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryNote> getNoteDetail(@PathVariable long id) {
        return ResponseEntity.ok(inventoryService.getNoteById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable long id) {
        inventoryService.deleteNote(id);
        return ResponseEntity.ok("Huy phieu thanh cong");
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<InputStreamResource> exportExcel(@PathVariable long id) throws IOException {
        InventoryNote note = inventoryService.getNoteById(id);
        ByteArrayInputStream in = inventoryService.exportToExcel(id);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=" + note.getCode() + ".xlsx");
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }

    @PostMapping("/export")
    public ResponseEntity<?> createExportNote(@RequestBody InventoryNoteRequest request, Authentication authentication) {
        return ResponseEntity.ok(inventoryService.createExportNote(request, username(authentication)));
    }

    private String username(Authentication authentication) {
        return authentication != null ? authentication.getName() : "system";
    }
}
