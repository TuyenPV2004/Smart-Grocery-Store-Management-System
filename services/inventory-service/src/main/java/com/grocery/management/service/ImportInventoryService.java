package com.grocery.management.service;

import com.grocery.management.dto.InventoryNoteRequest;
import com.grocery.management.dto.ProductSnapshot;
import com.grocery.management.dto.SupplierSnapshot;
import com.grocery.management.entity.InventoryNote;
import com.grocery.management.entity.InventoryNoteDetail;
import com.grocery.management.entity.InventoryType;
import com.grocery.management.entity.ProductBatch;
import com.grocery.management.exception.InvalidInventoryRequestException;
import com.grocery.management.repository.InventoryNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ImportInventoryService {
    private final InventoryNoteRepository inventoryNoteRepository;
    private final CatalogClient catalogClient;
    private final InventoryNoteService inventoryNoteService;
    private final InventoryBatchService inventoryBatchService;
    private final InventorySnapshotMapper snapshotMapper;
    private final InventoryEventPublisher eventPublisher;

    @Transactional
    public InventoryNote createImportNote(InventoryNoteRequest request, String username) {
        if (request.getSupplierId() == null) {
            throw new InvalidInventoryRequestException("Phai chon nha cung cap cho phieu nhap kho");
        }
        SupplierSnapshot supplier = catalogClient.getSupplierById(request.getSupplierId());

        InventoryNote note = inventoryNoteService.createBaseNote(request, username, InventoryType.IMPORT);
        note.setSupplierId(supplier.getId());
        note.setSupplierCode(supplier.getCode());
        note.setSupplierName(supplier.getVietnameseName());
        note = inventoryNoteRepository.save(note);

        List<InventoryNoteDetail> details = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (InventoryNoteRequest.InventoryNoteDetailDto item : InventoryRequestSupport.safeDetails(request)) {
            ProductSnapshot product = resolveProduct(item);
            int conversionRate = item.getConversionRate() != null && item.getConversionRate() > 0 ? item.getConversionRate() : 1;
            int importQuantity = item.getQuantity() != null ? item.getQuantity() : 0;
            int baseQuantity = importQuantity * conversionRate;
            BigDecimal importPrice = InventoryMoney.defaultMoney(item.getImportPrice());
            totalAmount = totalAmount.add(importPrice.multiply(BigDecimal.valueOf(baseQuantity)));

            String batchCode = item.getBatchCode() != null && !item.getBatchCode().isBlank()
                    ? item.getBatchCode()
                    : inventoryBatchService.generateBatchCode(product, supplier, item);

            ProductBatch batch = createBatch(note, item, product, supplier, batchCode, baseQuantity, importQuantity, conversionRate, importPrice);
            InventoryNoteDetail detail = createDetail(note, item, product, batchCode, baseQuantity, importQuantity, conversionRate, importPrice, batch);
            details.add(detail);
            eventPublisher.publishStockChanged(product, baseQuantity, note, "IMPORT");
        }
        note.setDetails(details);
        note.setTotalAmount(totalAmount);
        note.setFinalAmount(totalAmount);
        return inventoryNoteRepository.save(note);
    }

    private ProductSnapshot resolveProduct(InventoryNoteRequest.InventoryNoteDetailDto item) {
        if (item.getProductId() != null) {
            return catalogClient.getProductById(item.getProductId());
        }
        return catalogClient.getProductBySku(item.getSku());
    }

    private ProductBatch createBatch(
            InventoryNote note,
            InventoryNoteRequest.InventoryNoteDetailDto item,
            ProductSnapshot product,
            SupplierSnapshot supplier,
            String batchCode,
            int baseQuantity,
            int importQuantity,
            int conversionRate,
            BigDecimal importPrice) {
        ProductBatch batch = new ProductBatch();
        batch.setBatchCode(batchCode);
        snapshotMapper.applyProduct(batch, product);
        snapshotMapper.applySupplier(batch, supplier);
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
        return inventoryBatchService.save(batch);
    }

    private InventoryNoteDetail createDetail(
            InventoryNote note,
            InventoryNoteRequest.InventoryNoteDetailDto item,
            ProductSnapshot product,
            String batchCode,
            int baseQuantity,
            int importQuantity,
            int conversionRate,
            BigDecimal importPrice,
            ProductBatch batch) {
        InventoryNoteDetail detail = new InventoryNoteDetail();
        detail.setInventoryNote(note);
        snapshotMapper.applyProduct(detail, product);
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
        return detail;
    }
}
