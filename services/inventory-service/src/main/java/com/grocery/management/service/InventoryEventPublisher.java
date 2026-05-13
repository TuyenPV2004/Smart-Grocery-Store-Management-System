package com.grocery.management.service;

import com.grocery.management.dto.ProductSnapshot;
import com.grocery.management.dto.StockChangedEvent;
import com.grocery.management.entity.InventoryNote;
import com.grocery.management.entity.ProductBatch;
import com.grocery.management.repository.ProductBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryEventPublisher {
    private final ProductBatchRepository productBatchRepository;
    private final StockEventPublisher stockEventPublisher;

    public void publishStockChanged(ProductSnapshot product, int delta, InventoryNote note, String sourceType) {
        Integer currentQuantity = productBatchRepository.getTotalQuantityByProductId(product.getId());
        stockEventPublisher.publishStockChanged(new StockChangedEvent(UUID.randomUUID().toString(), product.getId(),
                product.getSku(), product.getName(), delta, currentQuantity, sourceType, note.getId(), Instant.now()));
    }

    public void publishStockChanged(ProductBatch batch, int delta, InventoryNote note, String sourceType) {
        Integer currentQuantity = productBatchRepository.getTotalQuantityByProductId(batch.getProductId());
        stockEventPublisher.publishStockChanged(new StockChangedEvent(UUID.randomUUID().toString(), batch.getProductId(),
                batch.getProductSku(), batch.getProductName(), delta, currentQuantity, sourceType, note.getId(), Instant.now()));
    }
}
