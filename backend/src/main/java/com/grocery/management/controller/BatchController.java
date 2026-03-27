package com.grocery.management.controller;

import com.grocery.management.entity.InventoryNoteDetail;
import com.grocery.management.entity.ProductBatch;
import com.grocery.management.repository.InventoryNoteDetailRepository;
import com.grocery.management.repository.ProductBatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/batches")
public class BatchController {

    @Autowired
    private ProductBatchRepository productBatchRepository;

    @Autowired
    private InventoryNoteDetailRepository inventoryNoteDetailRepository;

    /**
     * Get next sequence number for batch code generation
     * 
     * @param prefix Format: {SupplierCode}_{SKU}_{NSX}
     * @return Next sequence number (e.g., 1, 2, 3...)
     */
    @GetMapping("/next-sequence")
    public ResponseEntity<Map<String, Object>> getNextSequence(@RequestParam String prefix) {
        List<String> existingBatches = productBatchRepository.findBatchCodesByPrefix(prefix);

        int maxSeq = 0;
        for (String code : existingBatches) {
            try {
                // Extract last 3 digits (sequence number)
                String seqPart = code.substring(code.length() - 3);
                int seq = Integer.parseInt(seqPart);
                if (seq > maxSeq) {
                    maxSeq = seq;
                }
            } catch (Exception e) {
                // Ignore invalid batch codes
            }
        }

        int nextSeq = maxSeq + 1;
        String formattedSeq = String.format("%03d", nextSeq);

        Map<String, Object> response = new HashMap<>();
        response.put("nextSequence", nextSeq);
        response.put("formattedSequence", formattedSeq);
        response.put("existingCount", existingBatches.size());

        return ResponseEntity.ok(response);
    }

    /**
     * Get all batches with pagination
     */
    @GetMapping
    public ResponseEntity<Page<ProductBatch>> getAllBatches(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        String normalizedSearch = search != null && !search.trim().isEmpty() ? search.trim() : null;
        String normalizedStatus = status != null && !status.trim().isEmpty() ? status.trim() : "ALL";

        Page<ProductBatch> batches = productBatchRepository.searchBatches(
                normalizedSearch,
                normalizedStatus,
                LocalDate.now(),
                LocalDate.now().plusDays(30),
                pageable);

        // Populate transient fields
        for (ProductBatch batch : batches) {
            populateTransientFields(batch);
        }

        return ResponseEntity.ok(batches);
    }

    /**
     * Get batch by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductBatch> getBatchById(@PathVariable long id) {
        Optional<ProductBatch> batchOpt = productBatchRepository.findById(id);
        if (batchOpt.isPresent()) {
            ProductBatch batch = batchOpt.get();
            populateTransientFields(batch);
            return ResponseEntity.ok(batch);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Get batch by batch code
     */
    @GetMapping("/code/{batchCode}")
    public ResponseEntity<ProductBatch> getBatchByCode(@PathVariable String batchCode) {
        Optional<ProductBatch> batchOpt = productBatchRepository.findByBatchCode(batchCode);
        if (batchOpt.isPresent()) {
            ProductBatch batch = batchOpt.get();
            populateTransientFields(batch);
            return ResponseEntity.ok(batch);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Get available batches for a product by SKU
     * Returns batches ordered by expiry date (FEFO - First Expired First Out)
     * Only returns batches with quantity > 0
     * Used for export inventory batch selection
     */
    @GetMapping("/product/{sku}")
    public ResponseEntity<List<ProductBatch>> getAvailableBatchesByProductSku(@PathVariable String sku) {
        List<ProductBatch> batches = productBatchRepository
                .findByProduct_SkuAndQuantityGreaterThanOrderByExpiryDateAsc(sku, 0);
        return ResponseEntity.ok(batches);
    }

    /**
     * Delete batch by ID
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBatch(@PathVariable long id) {
        try {
            if (!productBatchRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            productBatchRepository.deleteById(id);
            return ResponseEntity.ok("Đã xóa lô hàng thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi xóa lô hàng: " + e.getMessage());
        }
    }

    private void populateTransientFields(ProductBatch batch) {
        try {
            if (batch.getBatchCode() != null && batch.getInventoryNote() != null) {
                // Find corresponding InventoryNoteDetail by matching batchCode in the note's
                // details
                List<InventoryNoteDetail> details = inventoryNoteDetailRepository
                        .findByInventoryNoteId(batch.getInventoryNote().getId());

                for (InventoryNoteDetail detail : details) {
                    if (batch.getBatchCode().equals(detail.getBatchCode())) {
                        batch.setConversionRate(detail.getConversionRate());
                        batch.setImportUnit(detail.getImportUnit());

                        // Calculate quantities in import unit
                        int rate = detail.getConversionRate() > 0 ? detail.getConversionRate() : 1;
                        batch.setQuantityInImportUnit(batch.getQuantity() / rate);

                        // For stock, we use the product's global stock divided by this batch's
                        // conversion rate
                        // This shows the global stock in terms of THIS batch's unit (e.g. 1080 items =
                        // 45 boxes)
                        if (batch.getProduct() != null) {
                            batch.setStockInImportUnit(batch.getProduct().getStockQuantity() / rate);
                        }
                        return; // Found and populated, exit
                    }
                }
            }

            // Fallbacks if not found or no note linked
            int defaultRate = 1;
            batch.setConversionRate(defaultRate);
            batch.setImportUnit(batch.getProduct() != null ? batch.getProduct().getUnit() : "đơn vị");
            batch.setQuantityInImportUnit(batch.getQuantity());
            if (batch.getProduct() != null) {
                batch.setStockInImportUnit(batch.getProduct().getStockQuantity());
            }

        } catch (Exception e) {
            // Log error but generally safe to ignore and use fallbacks implicitly
            // (transients will be null/0)
            System.err.println("Error populating transient fields for batch " + batch.getId() + ": " + e.getMessage());
        }
    }
}
