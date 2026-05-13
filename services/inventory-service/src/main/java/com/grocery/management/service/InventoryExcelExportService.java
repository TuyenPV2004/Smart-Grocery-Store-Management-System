package com.grocery.management.service;

import com.grocery.management.entity.InventoryNote;
import com.grocery.management.entity.InventoryNoteDetail;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class InventoryExcelExportService {
    private final InventoryNoteService inventoryNoteService;

    public ByteArrayInputStream exportToExcel(long noteId) throws IOException {
        InventoryNote note = inventoryNoteService.getNoteById(noteId);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(note.getCode());
            CellStyle headerCellStyle = createHeaderStyle(workbook);
            writeSummary(sheet, note);
            writeHeader(sheet, headerCellStyle);
            writeDetails(sheet, note);
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        CellStyle headerCellStyle = workbook.createCellStyle();
        headerCellStyle.setFont(headerFont);
        headerCellStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
        headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return headerCellStyle;
    }

    private void writeSummary(Sheet sheet, InventoryNote note) {
        sheet.createRow(0).createCell(0).setCellValue("MA PHIEU: " + safe(note.getCode()));
        sheet.createRow(1).createCell(0).setCellValue("NGAY TAO: " + safeDate(note.getCreatedAt()));
        sheet.createRow(2).createCell(0).setCellValue("NGUOI LAP PHIEU: " + safe(note.getCreatedByFullName()));
    }

    private void writeHeader(Sheet sheet, CellStyle headerCellStyle) {
        String[] columns = {"STT", "Ten san pham", "SKU", "Ma lo", "Nha cung cap", "NSX", "HSD", "Don vi", "So luong", "He so", "Don gia", "Thanh tien"};
        Row headerRow = sheet.createRow(5);
        for (int i = 0; i < columns.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columns[i]);
            cell.setCellStyle(headerCellStyle);
        }
    }

    private void writeDetails(Sheet sheet, InventoryNote note) {
        int rowIdx = 6;
        int stt = 1;
        for (InventoryNoteDetail detail : note.getDetails()) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(stt++);
            row.createCell(1).setCellValue(safe(detail.getProductName()));
            row.createCell(2).setCellValue(safe(detail.getProductSku()));
            row.createCell(3).setCellValue(safe(detail.getBatchCode()));
            row.createCell(4).setCellValue(safe(note.getSupplierName()));
            row.createCell(5).setCellValue(detail.getManufacturingDate() != null ? detail.getManufacturingDate().toString() : "");
            row.createCell(6).setCellValue(detail.getExpiryDate() != null ? detail.getExpiryDate().toString() : "");
            row.createCell(7).setCellValue(safe(detail.getImportUnit()));
            row.createCell(8).setCellValue(detail.getQuantityInImportUnit());
            row.createCell(9).setCellValue(detail.getConversionRate());
            row.createCell(10).setCellValue(InventoryMoney.defaultMoney(detail.getImportPrice()).doubleValue());
            row.createCell(11).setCellValue(InventoryMoney.defaultMoney(detail.getImportPrice()).multiply(java.math.BigDecimal.valueOf(detail.getQuantity())).doubleValue());
        }
        Row totalRow = sheet.createRow(rowIdx + 1);
        totalRow.createCell(10).setCellValue("TONG CONG:");
        totalRow.createCell(11).setCellValue(InventoryMoney.defaultMoney(note.getFinalAmount()).doubleValue());
        for (int i = 0; i < 12; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    private String safeDate(LocalDateTime value) {
        return value != null ? value.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")) : "";
    }
}
