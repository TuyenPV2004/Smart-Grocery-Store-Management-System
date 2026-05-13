package com.grocery.management.service;

import com.grocery.management.dto.InventoryNoteRequest;
import com.grocery.management.entity.InventoryNote;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final ImportInventoryService importInventoryService;
    private final ExportInventoryService exportInventoryService;
    private final InventoryNoteService inventoryNoteService;
    private final InventoryExcelExportService excelExportService;

    public InventoryNote createImportNote(InventoryNoteRequest request, String username) {
        return importInventoryService.createImportNote(request, username);
    }

    public InventoryNote createExportNote(InventoryNoteRequest request, String username) {
        return exportInventoryService.createExportNote(request, username);
    }

    public List<InventoryNote> getAllNotes() {
        return inventoryNoteService.getAllNotes();
    }

    public InventoryNote getNoteById(long id) {
        return inventoryNoteService.getNoteById(id);
    }

    public void deleteNote(long id) {
        inventoryNoteService.deleteNote(id);
    }

    public ByteArrayInputStream exportToExcel(long noteId) throws IOException {
        return excelExportService.exportToExcel(noteId);
    }
}
