package com.grocery.management.service;

import com.grocery.management.dto.InventoryNoteRequest;
import com.grocery.management.dto.ProductSnapshot;
import com.grocery.management.dto.StockChangedEvent;
import com.grocery.management.dto.SupplierSnapshot;
import com.grocery.management.entity.InventoryNote;
import com.grocery.management.entity.InventoryNoteDetail;
import com.grocery.management.entity.InventoryStatus;
import com.grocery.management.entity.InventoryType;
import com.grocery.management.entity.ProductBatch;
import com.grocery.management.repository.InventoryNoteRepository;
import com.grocery.management.repository.ProductBatchRepository;
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
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final InventoryNoteRepository inventoryNoteRepository;
    private final ProductBatchRepository productBatchRepository;
    private final CatalogClient catalogClient;
    private final StockEventPublisher stockEventPublisher;

    @Transactional
    public InventoryNote createImportNote(InventoryNoteRequest request, String username) {
        if (request.getSupplierId() == null) {
            throw new RuntimeException("Phai chon nha cung cap cho phieu nhap kho");
        }
        SupplierSnapshot supplier = catalogClient.getSupplierById(request.getSupplierId());

        InventoryNote note = baseNote(request, username, InventoryType.IMPORT);
        note.setSupplierId(supplier.getId());
        note.setSupplierCode(supplier.getCode());
        note.setSupplierName(supplier.getVietnameseName());
        note = inventoryNoteRepository.save(note);

        List<InventoryNoteDetail> details = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (InventoryNoteRequest.InventoryNoteDetailDto item : safeDetails(request)) {
            ProductSnapshot product = resolveProduct(item);
            int conversionRate = item.getConversionRate() != null && item.getConversionRate() > 0 ? item.getConversionRate() : 1;
            int importQuantity = item.getQuantity() != null ? item.getQuantity() : 0;
            int baseQuantity = importQuantity * conversionRate;
            BigDecimal importPrice = defaultMoney(item.getImportPrice());
            BigDecimal lineTotal = importPrice.multiply(BigDecimal.valueOf(baseQuantity));
            totalAmount = totalAmount.add(lineTotal);

            String batchCode = item.getBatchCode() != null && !item.getBatchCode().isBlank()
                    ? item.getBatchCode()
                    : generateBatchCode(product, supplier, item);

            ProductBatch batch = new ProductBatch();
            batch.setBatchCode(batchCode);
            applyProductSnapshot(batch, product);
            applySupplierSnapshot(batch, supplier);
            batch.setQuantity(baseQuantity);
            batch.setInitialQuantity(baseQuantity);
            batch.setManufacturingDate(item.getManufacturingDate());
            batch.setExpiryDate(item.getExpiryDate());
            batch.setImportPrice(importPrice);
            batch.setInventoryNoteId(note.getId());
            batch.setInventoryNoteCode(note.getCode());
            batch.setConversionRate(conversionRate);
            batch.setImportUnit(item.getImportUnit() != null ? item.getImportUnit() : product.getUnit());
            batch.setQuantityInImportUnit(importQuantity);
            productBatchRepository.save(batch);

            InventoryNoteDetail detail = new InventoryNoteDetail();
            detail.setInventoryNote(note);
            applyProductSnapshot(detail, product);
            detail.setBatchCode(batchCode);
            detail.setManufacturingDate(item.getManufacturingDate());
            detail.setExpiryDate(item.getExpiryDate());
            detail.setQuantity(baseQuantity);
            detail.setQuantityInImportUnit(importQuantity);
            detail.setImportUnit(batch.getImportUnit());
            detail.setConversionRate(conversionRate);
            detail.setImportPrice(importPrice);
            detail.setActualPrice(importPrice);
            detail.setOrigin(item.getOrigin());
            details.add(detail);
            publishStockChanged(product, baseQuantity, note, "IMPORT");
        }
        note.setDetails(details);
        note.setTotalAmount(totalAmount);
        note.setFinalAmount(totalAmount);
        return inventoryNoteRepository.save(note);
    }

    @Transactional
    public InventoryNote createExportNote(InventoryNoteRequest request, String username) {
        InventoryNote note = inventoryNoteRepository.save(baseNote(request, username, InventoryType.EXPORT));
        List<InventoryNoteDetail> details = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (InventoryNoteRequest.InventoryNoteDetailDto item : safeDetails(request)) {
            if (item.getBatchCode() == null || item.getBatchCode().isBlank()) {
                throw new RuntimeException("Ma lo hang khong duoc de trong");
            }
            ProductBatch batch = productBatchRepository.findByBatchCode(item.getBatchCode())
                    .orElseThrow(() -> new RuntimeException("Khong tim thay lo hang: " + item.getBatchCode()));
            int quantity = item.getQuantity() != null ? item.getQuantity() : 0;
            if (batch.getQuantity() == null || batch.getQuantity() < quantity) {
                throw new RuntimeException("Lo hang '" + item.getBatchCode() + "' khong du so luong");
            }
            batch.setQuantity(batch.getQuantity() - quantity);
            productBatchRepository.save(batch);

            BigDecimal price = item.getImportPrice() != null ? item.getImportPrice() : defaultMoney(batch.getImportPrice());
            totalAmount = totalAmount.add(price.multiply(BigDecimal.valueOf(quantity)));

            InventoryNoteDetail detail = new InventoryNoteDetail();
            detail.setInventoryNote(note);
            applyBatchSnapshot(detail, batch);
            detail.setQuantity(quantity);
            detail.setQuantityInImportUnit(quantity);
            detail.setConversionRate(1);
            detail.setImportUnit(batch.getProductUnit());
            detail.setManufacturingDate(batch.getManufacturingDate());
            detail.setExpiryDate(batch.getExpiryDate());
            detail.setBatchCode(batch.getBatchCode());
            detail.setImportPrice(price);
            detail.setActualPrice(price);
            details.add(detail);
            publishStockChanged(batch, -quantity, note, "EXPORT");
        }
        note.setDetails(details);
        note.setTotalAmount(totalAmount);
        note.setFinalAmount(totalAmount);
        return inventoryNoteRepository.save(note);
    }

    public List<InventoryNote> getAllNotes() {
        return inventoryNoteRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public InventoryNote getNoteById(long id) {
        return inventoryNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay phieu: " + id));
    }

    @Transactional
    public void deleteNote(long id) {
        if (!inventoryNoteRepository.existsById(id)) {
            throw new RuntimeException("Phieu khong ton tai: " + id);
        }
        inventoryNoteRepository.deleteById(id);
    }

    public ByteArrayInputStream exportToExcel(long noteId) throws IOException {
        InventoryNote note = getNoteById(noteId);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(note.getCode());
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            sheet.createRow(0).createCell(0).setCellValue("MA PHIEU: " + safe(note.getCode()));
            sheet.createRow(1).createCell(0).setCellValue("NGAY TAO: " + safeDate(note.getCreatedAt()));
            sheet.createRow(2).createCell(0).setCellValue("NGUOI LAP PHIEU: " + safe(note.getCreatedByFullName()));

            String[] columns = {"STT", "Ten san pham", "SKU", "Ma lo", "Nha cung cap", "NSX", "HSD", "Don vi", "So luong", "He so", "Don gia", "Thanh tien"};
            Row headerRow = sheet.createRow(5);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

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
                row.createCell(10).setCellValue(defaultMoney(detail.getImportPrice()).doubleValue());
                row.createCell(11).setCellValue(defaultMoney(detail.getImportPrice()).multiply(BigDecimal.valueOf(detail.getQuantity())).doubleValue());
            }
            Row totalRow = sheet.createRow(rowIdx + 1);
            totalRow.createCell(10).setCellValue("TONG CONG:");
            totalRow.createCell(11).setCellValue(defaultMoney(note.getFinalAmount()).doubleValue());
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    private InventoryNote baseNote(InventoryNoteRequest request, String username, InventoryType type) {
        InventoryNote note = new InventoryNote();
        note.setCode(request.getCode() != null && !request.getCode().isBlank()
                ? request.getCode()
                : (type == InventoryType.IMPORT ? "IMP" : "EXP") + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd-HHmmss")));
        note.setType(type);
        note.setStatus(InventoryStatus.COMPLETED);
        note.setCreatedAt(LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")));
        note.setNote(request.getNote());
        note.setCreatedByUsername(username);
        note.setCreatedByStaffCode(username);
        note.setCreatedByFullName(username);
        note.setDiscount(defaultMoney(request.getDiscount()));
        note.setVat(defaultMoney(request.getVat()));
        note.setAmountPaid(defaultMoney(request.getAmountPaid()));
        note.setCustomerName(request.getCustomerName());
        note.setExportReason(request.getExportReason());
        note.setPaymentStatus("PAID");
        return note;
    }

    private ProductSnapshot resolveProduct(InventoryNoteRequest.InventoryNoteDetailDto item) {
        if (item.getProductId() != null) {
            return catalogClient.getProductById(item.getProductId());
        }
        return catalogClient.getProductBySku(item.getSku());
    }

    private String generateBatchCode(ProductSnapshot product, SupplierSnapshot supplier, InventoryNoteRequest.InventoryNoteDetailDto item) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("ddMMyy");
        String nsx = item.getManufacturingDate() != null ? item.getManufacturingDate().format(fmt) : "000000";
        String hsd = item.getExpiryDate() != null ? item.getExpiryDate().format(fmt) : "000000";
        String prefix = safe(supplier.getCode(), "SUP") + "_" + safe(product.getSku(), "SKU") + "_" + nsx;
        int next = productBatchRepository.findBatchCodesByPrefix(prefix).size() + 1;
        return prefix + "_" + hsd + "_" + String.format("%03d", next);
    }

    private void publishStockChanged(ProductSnapshot product, int delta, InventoryNote note, String sourceType) {
        Integer currentQuantity = productBatchRepository.getTotalQuantityByProductId(product.getId());
        stockEventPublisher.publishStockChanged(new StockChangedEvent(UUID.randomUUID().toString(), product.getId(),
                product.getSku(), product.getName(), delta, currentQuantity, sourceType, note.getId(), Instant.now()));
    }

    private void publishStockChanged(ProductBatch batch, int delta, InventoryNote note, String sourceType) {
        Integer currentQuantity = productBatchRepository.getTotalQuantityByProductId(batch.getProductId());
        stockEventPublisher.publishStockChanged(new StockChangedEvent(UUID.randomUUID().toString(), batch.getProductId(),
                batch.getProductSku(), batch.getProductName(), delta, currentQuantity, sourceType, note.getId(), Instant.now()));
    }

    private void applyProductSnapshot(ProductBatch batch, ProductSnapshot product) {
        batch.setProductId(product.getId());
        batch.setProductSku(product.getSku());
        batch.setProductName(product.getName());
        batch.setProductUnit(product.getUnit());
        batch.setProductBrand(product.getBrand());
        batch.setProductThumbnail(product.getThumbnail());
    }

    private void applyProductSnapshot(InventoryNoteDetail detail, ProductSnapshot product) {
        detail.setProductId(product.getId());
        detail.setProductSku(product.getSku());
        detail.setProductName(product.getName());
        detail.setProductUnit(product.getUnit());
        detail.setProductBrand(product.getBrand());
        detail.setProductThumbnail(product.getThumbnail());
    }

    private void applySupplierSnapshot(ProductBatch batch, SupplierSnapshot supplier) {
        batch.setSupplierId(supplier.getId());
        batch.setSupplierCode(supplier.getCode());
        batch.setSupplierName(supplier.getVietnameseName());
    }

    private void applyBatchSnapshot(InventoryNoteDetail detail, ProductBatch batch) {
        detail.setProductId(batch.getProductId());
        detail.setProductSku(batch.getProductSku());
        detail.setProductName(batch.getProductName());
        detail.setProductUnit(batch.getProductUnit());
        detail.setProductBrand(batch.getProductBrand());
        detail.setProductThumbnail(batch.getProductThumbnail());
    }

    private List<InventoryNoteRequest.InventoryNoteDetailDto> safeDetails(InventoryNoteRequest request) {
        return request.getDetails() != null ? request.getDetails() : List.of();
    }

    private BigDecimal defaultMoney(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    private String safe(String value, String fallback) {
        return value != null && !value.isBlank() ? value : fallback;
    }

    private String safeDate(LocalDateTime value) {
        return value != null ? value.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")) : "";
    }
}
