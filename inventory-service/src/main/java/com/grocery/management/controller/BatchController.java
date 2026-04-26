package com.grocery.management.controller;

import com.grocery.management.entity.ProductBatch;
import com.grocery.management.repository.ProductBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/batches")
@RequiredArgsConstructor
public class BatchController {
    private final ProductBatchRepository productBatchRepository;

    @GetMapping("/next-sequence")
    public ResponseEntity<Map<String, Object>> getNextSequence(@RequestParam String prefix) {
        List<String> existingBatches = productBatchRepository.findBatchCodesByPrefix(prefix);
        int maxSeq = 0;
        for (String code : existingBatches) {
            try {
                maxSeq = Math.max(maxSeq, Integer.parseInt(code.substring(code.length() - 3)));
            } catch (Exception ignored) {
            }
        }
        int nextSeq = maxSeq + 1;
        Map<String, Object> response = new HashMap<>();
        response.put("nextSequence", nextSeq);
        response.put("formattedSequence", String.format("%03d", nextSeq));
        response.put("existingCount", existingBatches.size());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<ProductBatch>> getAllBatches(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        String normalizedSearch = search != null && !search.trim().isEmpty() ? search.trim() : null;
        String normalizedStatus = status != null && !status.trim().isEmpty() ? status.trim() : "ALL";
        return ResponseEntity.ok(productBatchRepository.searchBatches(
                normalizedSearch, normalizedStatus, LocalDate.now(), LocalDate.now().plusDays(30), pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductBatch> getBatchById(@PathVariable long id) {
        return productBatchRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{batchCode}")
    public ResponseEntity<ProductBatch> getBatchByCode(@PathVariable String batchCode) {
        return productBatchRepository.findByBatchCode(batchCode)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/product/{sku}")
    public ResponseEntity<List<ProductBatch>> getAvailableBatchesByProductSku(@PathVariable String sku) {
        return ResponseEntity.ok(productBatchRepository.findByProductSkuAndQuantityGreaterThanOrderByExpiryDateAsc(sku, 0));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBatch(@PathVariable long id) {
        if (!productBatchRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        productBatchRepository.deleteById(id);
        return ResponseEntity.ok("Da xoa lo hang thanh cong");
    }
}
