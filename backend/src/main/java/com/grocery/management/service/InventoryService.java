package com.grocery.management.service;

import com.grocery.management.dto.InventoryNoteRequest;
import com.grocery.management.dto.InventoryNoteRequest.InventoryNoteDetailDto;
import com.grocery.management.entity.*;
import com.grocery.management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.ZoneId;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryNoteRepository inventoryNoteRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final ProductBatchRepository productBatchRepository;
    private final InventoryNoteDetailRepository inventoryNoteDetailRepository;

    @Transactional
    public InventoryNote createImportNote(InventoryNoteRequest request, String username) {
        InventoryNote note = new InventoryNote();
        if (request.getCode() != null && !request.getCode().isEmpty()) {
            note.setCode(request.getCode());
        } else {
            String noteCode = "IMP" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd-HHmmss"));
            note.setCode(noteCode);
        }

        note.setType(InventoryType.IMPORT);
        note.setStatus(InventoryStatus.COMPLETED);
        note.setCreatedAt(LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")));
        note.setNote(request.getNote());

        // --- SỬA ĐỔI: Bắt lỗi nếu frontend không gửi ID nhà cung cấp ---
        // --- SỬA ĐỔI: Bắt lỗi nếu frontend không gửi ID nhà cung cấp ---
        Long supplierId = request.getSupplierId();
        if (supplierId == null) {
            throw new RuntimeException("Phải chọn Nhà cung cấp cho phiếu Nhập kho (Dữ liệu Nhà cung cấp bị thiếu)");
        }
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(
                        () -> new RuntimeException("Không tìm thấy Nhà cung cấp với ID: " + supplierId));
        note.setSupplier(supplier);
        // -------------------------------------------------------------
        User createdBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại: " + username));
        note.setCreatedBy(createdBy);

        InventoryNote savedNote = inventoryNoteRepository.save(note);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<InventoryNoteDetail> detailList = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("ddMMyy");
        for (InventoryNoteDetailDto item : request.getDetails()) {
            Product product = productRepository.findBySku(item.getSku())
                    .orElseThrow(() -> new RuntimeException("SKU not found: " + item.getSku()));
            BigDecimal lineTotal = item.getImportPrice()
                    .multiply(BigDecimal.valueOf(item.getConversionRate()))
                    .multiply(BigDecimal.valueOf(item.getQuantity()));
            totalAmount = totalAmount.add(lineTotal);

            // Use batch code from frontend if provided, otherwise generate new one
            String batchCode;
            if (item.getBatchCode() != null && !item.getBatchCode().isEmpty()) {
                batchCode = item.getBatchCode();
            } else {
                // Fallback: generate batch code if not provided by frontend
                String supCode = (product.getSupplier() != null) ? product.getSupplier().getCode() : "UNK";
                String nsxStr = item.getManufacturingDate().format(fmt);
                String hsdStr = item.getExpiryDate().format(fmt);
                String basePrefix = supCode + "_" + product.getSku() + "_" + nsxStr;
                List<String> existingBatches = productBatchRepository.findBatchCodesByPrefix(basePrefix);
                int maxSeq = 0;
                for (String code : existingBatches) {
                    try {
                        String seqPart = code.substring(code.length() - 3);
                        int seq = Integer.parseInt(seqPart);
                        if (seq > maxSeq)
                            maxSeq = seq;
                    } catch (Exception e) {
                    }
                }
                String seqStr = String.format("%03d", maxSeq + 1);
                batchCode = basePrefix + "_" + hsdStr + "_" + seqStr;
            }

            ProductBatch batch = new ProductBatch();
            batch.setBatchCode(batchCode);
            batch.setProduct(product);
            batch.setManufacturingDate(item.getManufacturingDate());
            batch.setExpiryDate(item.getExpiryDate());
            batch.setImportPrice(item.getImportPrice());
            batch.setInventoryNote(savedNote); // Link batch to inventory note
            if (product.getSupplier() != null) {
                // Ưu tiên 1: Lấy từ Sản phẩm nếu có
                batch.setSupplier(product.getSupplier());
            } else {
                // Product chưa có Supplier, thử tìm từ mã BatchCode (VD: SUP001_...)
                boolean foundFromBatch = false;
                if (batchCode != null && batchCode.contains("_")) {
                    try {
                        String supCode = batchCode.split("_")[0]; // Lấy "SUP001"
                        Optional<Supplier> supOpt = supplierRepository.findByCode(supCode);
                        if (supOpt.isPresent()) {
                            batch.setSupplier(supOpt.get());
                            foundFromBatch = true;
                        }
                    } catch (Exception e) {
                        // Bỏ qua lỗi parse
                    }
                }

                // Fallback: Nếu không tìm thấy từ Batch, mới lấy từ Note
                if (!foundFromBatch) {
                    batch.setSupplier(note.getSupplier());
                }
            }

            int totalBaseQty = item.getQuantity() * item.getConversionRate();
            batch.setQuantity(totalBaseQty);
            batch.setInitialQuantity(totalBaseQty);
            productBatchRepository.save(batch);
            product.setStockQuantity(product.getStockQuantity() + totalBaseQty);
            if (item.getImportPrice() != null && item.getImportPrice().compareTo(BigDecimal.ZERO) > 0) {
                product.setImportPrice(item.getImportPrice());
            }
            productRepository.save(product);
            InventoryNoteDetail detail = new InventoryNoteDetail();
            detail.setInventoryNote(savedNote);
            detail.setProduct(product);
            detail.setBatchCode(batchCode);
            detail.setManufacturingDate(item.getManufacturingDate());
            detail.setExpiryDate(item.getExpiryDate());
            detail.setQuantity(totalBaseQty); // SL quy đổi
            detail.setQuantityInImportUnit(item.getQuantity()); // SL theo đơn vị nhập
            detail.setImportUnit(item.getImportUnit());
            detail.setConversionRate(item.getConversionRate());
            detail.setImportPrice(item.getImportPrice());
            detail.setActualPrice(item.getImportPrice());
            detail.setOrigin(item.getOrigin());

            detailList.add(inventoryNoteDetailRepository.save(detail));
        }
        savedNote.setDetails(detailList);
        savedNote.setTotalAmount(totalAmount);
        savedNote.setFinalAmount(totalAmount);

        return inventoryNoteRepository.save(savedNote);
    }

    @Transactional
    public InventoryNote createExportNote(InventoryNoteRequest request, String username) {
        InventoryNote note = new InventoryNote();

        // 1. Get user who creates the export note
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
        note.setCreatedBy(user);

        // 2. Set export-specific fields
        note.setCustomerName(request.getCustomerName());
        note.setExportReason(request.getExportReason());
        note.setCode(request.getCode());
        note.setNote(request.getNote());

        // Export doesn't have supplier
        note.setSupplier(null);

        note.setType(InventoryType.EXPORT);
        note.setStatus(InventoryStatus.COMPLETED);
        note.setCreatedAt(LocalDateTime.now());

        List<InventoryNoteDetail> details = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        // 3. Process each export item with user-selected batch
        for (InventoryNoteRequest.InventoryNoteDetailDto item : request.getDetails()) {
            // Validate batch code is provided
            if (item.getBatchCode() == null || item.getBatchCode().isEmpty()) {
                throw new RuntimeException("Mã lô hàng không được để trống");
            }

            // Find the specific batch by code
            ProductBatch batch = productBatchRepository.findByBatchCode(item.getBatchCode())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lô hàng: " + item.getBatchCode()));

            // Validate batch has enough quantity
            if (batch.getQuantity() < item.getQuantity()) {
                throw new RuntimeException("Lô hàng '" + item.getBatchCode() + "' không đủ số lượng. " +
                        "Hiện có: " + batch.getQuantity() + ", yêu cầu: " + item.getQuantity());
            }

            Product product = batch.getProduct();

            // Deduct from batch
            batch.setQuantity(batch.getQuantity() - item.getQuantity());
            productBatchRepository.save(batch);

            // Deduct from product total stock
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            productRepository.save(product);

            // Create export detail
            InventoryNoteDetail detail = new InventoryNoteDetail();
            detail.setProduct(product);

            // --- SỬA LỖI: Cập nhật đầy đủ các trường dữ liệu cho Excel ---
            detail.setQuantity(item.getQuantity()); // Số lượng cơ sở (để tính toán kho)

            // 1. Gán số lượng hiển thị (với Export, mặc định coi như đơn vị cơ bản)
            detail.setQuantityInImportUnit(item.getQuantity());

            // 2. Gán hệ số quy đổi là 1 (để phép nhân trong Excel không bị về 0)
            detail.setConversionRate(1);

            // 3. Lấy đơn vị tính từ sản phẩm
            detail.setImportUnit(product.getUnit());

            // 4. Lấy ngày SX và HSD từ Lô hàng (Batch)
            detail.setManufacturingDate(batch.getManufacturingDate());
            detail.setExpiryDate(batch.getExpiryDate());
            // -------------------------------------------------------------

            detail.setBatchCode(item.getBatchCode()); // Store user-selected batch code

            // Use export price from request (or product selling price as fallback)
            BigDecimal exportPrice = item.getImportPrice() != null ? item.getImportPrice() : product.getSellPrice();
            detail.setImportPrice(exportPrice);

            // Set actual price giống import price cho đồng bộ
            detail.setActualPrice(exportPrice);

            detail.setInventoryNote(note);

            // Calculate total
            totalAmount = totalAmount.add(exportPrice.multiply(BigDecimal.valueOf(item.getQuantity())));

            details.add(detail);
        }

        note.setDetails(details);
        note.setTotalAmount(totalAmount);
        // Set luôn final amount
        note.setFinalAmount(totalAmount);

        return inventoryNoteRepository.save(note);
    }

    @SuppressWarnings("null")
    @Transactional
    public InventoryNote createInventoryNote(InventoryNoteRequest request, String username) {
        InventoryNote note = new InventoryNote();
        note.setCode(generateNoteCode(request.getType()));
        note.setType(request.getType());
        note.setStatus(InventoryStatus.DRAFT);
        note.setCreatedAt(LocalDateTime.now());
        note.setNote(request.getNote());

        note.setDiscount(request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO);
        note.setVat(request.getVat() != null ? request.getVat() : BigDecimal.ZERO);
        note.setAmountPaid(request.getAmountPaid() != null ? request.getAmountPaid() : BigDecimal.ZERO);

        if (request.getType() == InventoryType.IMPORT) {
            if (request.getSupplierId() == null) {
                throw new RuntimeException("Phải chọn Nhà cung cấp cho phiếu Nhập kho");
            }
            Supplier supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhà cung cấp"));
            note.setSupplier(supplier);
        }

        InventoryNote savedNote = inventoryNoteRepository.save(note);

        User createdBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
        note.setCreatedBy(createdBy);

        List<InventoryNoteDetail> immutableDetails = request.getDetails().stream().map(itemDto -> {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại ID: " + itemDto.getProductId()));

            if (request.getType() == InventoryType.EXPORT) {
                if (product.getStockQuantity() < itemDto.getQuantity()) {
                    throw new RuntimeException("Sản phẩm " + product.getName() + " không đủ tồn kho để xuất. Hiện có: "
                            + product.getStockQuantity());
                }
            }

            InventoryNoteDetail detail = new InventoryNoteDetail();
            detail.setInventoryNote(savedNote);
            detail.setProduct(product);
            detail.setQuantity(itemDto.getQuantity());
            detail.setImportPrice(itemDto.getImportPrice());
            detail.setActualPrice(itemDto.getPrice());
            detail.setItemDiscount(itemDto.getItemDiscount() != null ? itemDto.getItemDiscount() : BigDecimal.ZERO);
            detail.setExpiryDate(itemDto.getExpiryDate());

            return detail;
        }).toList();

        List<InventoryNoteDetail> details = new ArrayList<>(immutableDetails);
        savedNote.setDetails(details);

        BigDecimal totalMerchandise = BigDecimal.ZERO;
        for (InventoryNoteDetail detail : details) {
            BigDecimal lineTotal = detail.getActualPrice()
                    .multiply(BigDecimal.valueOf(detail.getQuantity()))
                    .subtract(detail.getItemDiscount());
            totalMerchandise = totalMerchandise.add(lineTotal);
        }

        savedNote.setTotalAmount(totalMerchandise);
        BigDecimal finalAmount = totalMerchandise.subtract(savedNote.getDiscount()).add(savedNote.getVat());
        savedNote.setFinalAmount(finalAmount);

        if (savedNote.getAmountPaid().compareTo(finalAmount) >= 0) {
            savedNote.setPaymentStatus("PAID");
        } else if (savedNote.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
            savedNote.setPaymentStatus("PARTIAL");
        } else {
            savedNote.setPaymentStatus("UNPAID");
        }

        inventoryNoteRepository.save(savedNote);
        return updateStatus(savedNote.getId(), InventoryStatus.COMPLETED);
    }

    @SuppressWarnings("null")
    @Transactional
    public InventoryNote updateStatus(Long noteId, InventoryStatus newStatus) {
        InventoryNote note = inventoryNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu"));

        if (note.getStatus() == InventoryStatus.COMPLETED || note.getStatus() == InventoryStatus.CANCELLED) {
            throw new RuntimeException("Không thể đổi trạng thái phiếu đã Hoàn thành hoặc Hủy");
        }

        if (newStatus == InventoryStatus.COMPLETED) {
            for (InventoryNoteDetail detail : note.getDetails()) {
                Product product = detail.getProduct();
                int qty = detail.getQuantity();

                if (note.getType() == InventoryType.IMPORT) {
                    int oldStock = product.getStockQuantity();
                    BigDecimal oldCost = product.getImportPrice() != null ? product.getImportPrice() : BigDecimal.ZERO;
                    BigDecimal oldValue = oldCost.multiply(BigDecimal.valueOf(oldStock));
                    BigDecimal newValue = detail.getActualPrice().multiply(BigDecimal.valueOf(qty));
                    int newTotalStock = oldStock + qty;

                    if (newTotalStock > 0) {
                        BigDecimal newAvgCost = oldValue.add(newValue)
                                .divide(BigDecimal.valueOf(newTotalStock), 2, java.math.RoundingMode.HALF_UP);
                        product.setImportPrice(newAvgCost);
                    }
                    product.setStockQuantity(newTotalStock);

                } else if (note.getType() == InventoryType.EXPORT) {
                    if (product.getStockQuantity() < qty) {
                        throw new RuntimeException("Không đủ tồn kho để duyệt phiếu xuất: " + product.getName());
                    }
                    product.setStockQuantity(product.getStockQuantity() - qty);
                }
                productRepository.save(product);
            }

            if (note.getType() == InventoryType.IMPORT && note.getSupplier() != null) {
                BigDecimal debt = note.getFinalAmount().subtract(note.getAmountPaid());
                if (debt.compareTo(BigDecimal.ZERO) > 0) {
                    Supplier s = note.getSupplier();
                    BigDecimal currentDebt = s.getCurrentDebt() != null ? s.getCurrentDebt() : BigDecimal.ZERO;
                    s.setCurrentDebt(currentDebt.add(debt));
                    supplierRepository.save(s);
                }
            }
        }

        note.setStatus(newStatus);
        return inventoryNoteRepository.save(note);
    }

    @SuppressWarnings("null")
    @Transactional
    public void cancelInventoryNote(Long noteId) {
        InventoryNote note = inventoryNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu"));

        if (note.getStatus() == InventoryStatus.CANCELLED)
            return;

        if (note.getStatus() == InventoryStatus.COMPLETED) {
            for (InventoryNoteDetail detail : note.getDetails()) {
                Product product = detail.getProduct();
                int qty = detail.getQuantity();

                if (note.getType() == InventoryType.IMPORT) {
                    if (product.getStockQuantity() < qty) {
                        throw new RuntimeException("Không thể hủy phiếu nhập vì hàng đã bị xuất đi mất rồi!");
                    }
                    product.setStockQuantity(product.getStockQuantity() - qty);
                } else if (note.getType() == InventoryType.EXPORT) {
                    product.setStockQuantity(product.getStockQuantity() + qty);
                }
                productRepository.save(product);
            }
        }

        note.setStatus(InventoryStatus.CANCELLED);
        inventoryNoteRepository.save(note);
    }

    public List<Product> getLowStockProducts() {
        return productRepository.findByStockQuantityLessThanEqualMinStock();
    }

    private String generateNoteCode(InventoryType type) {
        String prefix = type == InventoryType.IMPORT ? "PN" : "PX";
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String timePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss"));
        int randomSuffix = new Random().nextInt(1000);
        return String.format("%s_%s_%s_%03d", prefix, datePart, timePart, randomSuffix);
    }

    public ByteArrayInputStream exportToExcel(long noteId) throws IOException {
        InventoryNote note = inventoryNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu nhập: " + noteId));

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(note.getCode());
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // --- SỬA ĐỔI 1: Xóa dòng Nhà cung cấp ở Header chung ---
            // Row 0: Mã phiếu
            Row titleRow = sheet.createRow(0);
            titleRow.createCell(0).setCellValue("MÃ PHIẾU: " + note.getCode());

            // Row 1: Ngày tạo
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
            String dateStr = (note.getCreatedAt() != null) ? note.getCreatedAt().format(formatter) : "";
            sheet.createRow(1).createCell(0).setCellValue("NGÀY TẠO: " + dateStr);

            // Row 2: Người lập phiếu (Đẩy từ dòng 3 lên dòng 2)
            String creatorName = (note.getCreatedBy() != null) ? note.getCreatedBy().getFullName() : "";
            sheet.createRow(2).createCell(0).setCellValue("NGƯỜI LẬP PHIẾU: " + creatorName);
            // -----------------------------------------------------

            // Row 5: Header bảng
            Row headerRow = sheet.createRow(5);
            String[] columns = {
                    "Số thứ tự",
                    "Tên sản phẩm",
                    "Mã SKU",
                    "Mã lô",
                    "Nhà cung cấp",
                    "Ngày sản xuất",
                    "Hạn sử dụng",
                    "Đơn vị",
                    "Số lượng",
                    "Hệ số",
                    "Đơn giá",
                    "Thành tiền"
            };

            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            int rowIdx = 6;
            int stt = 1;
            if (note.getDetails() != null) {
                for (InventoryNoteDetail detail : note.getDetails()) {
                    Row row = sheet.createRow(rowIdx++);

                    // 0. STT
                    row.createCell(0).setCellValue(stt++);
                    // 1. Tên sản phẩm
                    row.createCell(1).setCellValue(detail.getProduct().getName());
                    // 2. Mã SKU
                    row.createCell(2).setCellValue(detail.getProduct().getSku());
                    // 3. Mã lô
                    row.createCell(3).setCellValue(detail.getBatchCode());

                    // --- SỬA ĐỔI 2: Logic hiển thị cột Nhà cung cấp (Có fallback) ---
                    String productSupplier = "";
                    String batchCode = detail.getBatchCode();

                    // 1. Ưu tiên cao nhất: Bóc tách từ Mã lô (Batch Code)
                    if (batchCode != null && batchCode.contains("_")) {
                        try {
                            // Cắt chuỗi và Trim để xóa khoảng trắng thừa (quan trọng)
                            String supCode = batchCode.split("_")[0].trim();

                            // Dùng findFirstByCode thay vì findByCode
                            Optional<Supplier> supOpt = supplierRepository.findFirstByCode(supCode);
                            if (supOpt.isPresent()) {
                                productSupplier = supOpt.get().getVietnameseName();
                            }
                        } catch (Exception e) {
                            // Nếu lỗi, in ra console để debug (nhưng không làm sập luồng)
                            System.err.println("Lỗi tìm NCC từ batch: " + batchCode + " - " + e.getMessage());
                        }
                    }
                    if (productSupplier.isEmpty() && detail.getProduct().getSupplier() != null) {
                        productSupplier = detail.getProduct().getSupplier().getVietnameseName();
                    }
                    if (productSupplier.isEmpty() && note.getSupplier() != null) {
                        productSupplier = note.getSupplier().getVietnameseName();
                    }

                    row.createCell(4).setCellValue(productSupplier);

                    row.createCell(5).setCellValue(
                            detail.getManufacturingDate() != null ? detail.getManufacturingDate().toString() : "");

                    // 3. Hạn sử dụng
                    row.createCell(6)
                            .setCellValue(detail.getExpiryDate() != null ? detail.getExpiryDate().toString() : "");

                    // 4. Đơn vị nhập
                    row.createCell(7).setCellValue(detail.getImportUnit());
                    // 5. Số lượng nhập
                    row.createCell(8).setCellValue(detail.getQuantityInImportUnit());
                    // 6. Hệ số quy đổi
                    row.createCell(9).setCellValue(detail.getConversionRate());

                    // 7. Đơn giá
                    BigDecimal price = detail.getImportPrice() != null ? detail.getImportPrice() : BigDecimal.ZERO;
                    row.createCell(10).setCellValue(price.doubleValue());

                    // 8. Thành tiền
                    double lineTotal = price.doubleValue() * detail.getQuantityInImportUnit()
                            * detail.getConversionRate();
                    row.createCell(11).setCellValue(lineTotal);

                }
            }

            // Hàng Tổng cộng
            Row totalRow = sheet.createRow(rowIdx + 1);
            totalRow.createCell(10).setCellValue("TỔNG CỘNG:");
            Cell totalCell = totalRow.createCell(11);
            totalCell.setCellValue(note.getFinalAmount() != null ? note.getFinalAmount().doubleValue() : 0);

            // Auto-size các cột
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public List<InventoryNote> getAllNotes() {
        return inventoryNoteRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public InventoryNote getNoteById(long id) {
        return inventoryNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu: " + id));
    }

    @Transactional
    public void deleteNote(long id) {
        if (!inventoryNoteRepository.existsById(id)) {
            throw new RuntimeException("Phiếu không tồn tại: " + id);
        }
        inventoryNoteRepository.deleteById(id);
    }
}