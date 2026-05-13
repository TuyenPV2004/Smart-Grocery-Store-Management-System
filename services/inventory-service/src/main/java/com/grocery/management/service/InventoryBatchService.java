package com.grocery.management.service;

import com.grocery.management.dto.InventoryNoteRequest;
import com.grocery.management.dto.ProductSnapshot;
import com.grocery.management.dto.SupplierSnapshot;
import com.grocery.management.entity.ProductBatch;
import com.grocery.management.exception.InvalidInventoryRequestException;
import com.grocery.management.exception.ProductBatchNotFoundException;
import com.grocery.management.repository.ProductBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryBatchService {
    private final ProductBatchRepository productBatchRepository;

    public ProductBatch getByBatchCode(String batchCode) {
        return productBatchRepository.findByBatchCode(batchCode)
                .orElseThrow(() -> new ProductBatchNotFoundException("Khong tim thay lo hang: " + batchCode));
    }

    public ProductBatch save(ProductBatch batch) {
        return productBatchRepository.save(batch);
    }

    public Integer getTotalQuantityByProductId(Long productId) {
        return productBatchRepository.getTotalQuantityByProductId(productId);
    }

    public String generateBatchCode(ProductSnapshot product, SupplierSnapshot supplier, InventoryNoteRequest.InventoryNoteDetailDto item) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("ddMMyy");
        String nsx = item.getManufacturingDate() != null ? item.getManufacturingDate().format(fmt) : "000000";
        String hsd = item.getExpiryDate() != null ? item.getExpiryDate().format(fmt) : "000000";
        String prefix = safe(supplier.getCode(), "SUP") + "_" + safe(product.getSku(), "SKU") + "_" + nsx;
        int next = productBatchRepository.findBatchCodesByPrefix(prefix).size() + 1;
        return prefix + "_" + hsd + "_" + String.format("%03d", next);
    }

    public List<String> exportLockKeys(InventoryNoteRequest request) {
        List<String> keys = new ArrayList<>();
        for (InventoryNoteRequest.InventoryNoteDetailDto item : InventoryRequestSupport.safeDetails(request)) {
            if (item.getBatchCode() == null || item.getBatchCode().isBlank()) {
                throw new InvalidInventoryRequestException("Ma lo hang khong duoc de trong");
            }
            ProductBatch batch = getByBatchCode(item.getBatchCode());
            keys.add(productLockKey(batch.getProductId()));
        }
        return keys;
    }

    public String productLockKey(Long productId) {
        return "stock:product:" + productId;
    }

    private String safe(String value, String fallback) {
        return value != null && !value.isBlank() ? value : fallback;
    }
}
