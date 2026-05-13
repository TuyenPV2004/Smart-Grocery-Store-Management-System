package com.grocery.management.service;

import com.grocery.management.entity.InventoryNote;
import com.grocery.management.entity.InventoryNoteDetail;
import com.grocery.management.entity.InventoryStatus;
import com.grocery.management.entity.InventoryType;
import com.grocery.management.entity.ProductBatch;
import com.grocery.management.repository.InventoryNoteRepository;
import com.grocery.management.repository.ProductBatchRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DataJpaTest(properties = {
        "spring.cloud.config.enabled=false",
        "spring.config.import=",
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class InventoryNoteServiceCancelTest {
    @Autowired
    private InventoryNoteRepository inventoryNoteRepository;

    @Autowired
    private ProductBatchRepository productBatchRepository;

    @Test
    void cancelImportNoteRevertsImportedQuantityAndMarksCancelled() {
        ProductBatch batch = productBatchRepository.save(batch("BATCH-IMPORT", 10));
        InventoryNote note = inventoryNoteRepository.save(note(InventoryType.IMPORT, "NOTE-IMPORT", detail("BATCH-IMPORT", batch.getProductId(), 4)));

        service().deleteNote(note.getId());

        ProductBatch updatedBatch = productBatchRepository.findByBatchCode("BATCH-IMPORT").orElseThrow();
        InventoryNote updatedNote = inventoryNoteRepository.findById(note.getId()).orElseThrow();
        assertThat(updatedBatch.getQuantity()).isEqualTo(6);
        assertThat(updatedNote.getStatus()).isEqualTo(InventoryStatus.CANCELLED);
    }

    @Test
    void cancelExportNoteRestoresExportedQuantityAndMarksCancelled() {
        ProductBatch batch = productBatchRepository.save(batch("BATCH-EXPORT", 6));
        InventoryNote note = inventoryNoteRepository.save(note(InventoryType.EXPORT, "NOTE-EXPORT", detail("BATCH-EXPORT", batch.getProductId(), 4)));

        service().deleteNote(note.getId());

        ProductBatch updatedBatch = productBatchRepository.findByBatchCode("BATCH-EXPORT").orElseThrow();
        InventoryNote updatedNote = inventoryNoteRepository.findById(note.getId()).orElseThrow();
        assertThat(updatedBatch.getQuantity()).isEqualTo(10);
        assertThat(updatedNote.getStatus()).isEqualTo(InventoryStatus.CANCELLED);
    }

    private InventoryNoteService service() {
        RedisDistributedLockService lockService = mock(RedisDistributedLockService.class);
        when(lockService.lockAll(any())).thenReturn(List.of());
        doNothing().when(lockService).releaseAfterTransaction(any());
        return new InventoryNoteService(
                inventoryNoteRepository,
                productBatchRepository,
                mock(InventoryEventPublisher.class),
                lockService);
    }

    private ProductBatch batch(String batchCode, int quantity) {
        ProductBatch batch = new ProductBatch();
        batch.setBatchCode(batchCode);
        batch.setProductId(100L);
        batch.setProductSku("SKU-100");
        batch.setProductName("Product 100");
        batch.setQuantity(quantity);
        return batch;
    }

    private InventoryNote note(InventoryType type, String code, InventoryNoteDetail detail) {
        InventoryNote note = new InventoryNote();
        note.setCode(code);
        note.setType(type);
        note.setStatus(InventoryStatus.COMPLETED);
        note.setCreatedAt(LocalDateTime.now());
        note.setTotalAmount(BigDecimal.ZERO);
        note.setFinalAmount(BigDecimal.ZERO);
        note.setDetails(List.of(detail));
        detail.setInventoryNote(note);
        return note;
    }

    private InventoryNoteDetail detail(String batchCode, Long productId, int quantity) {
        InventoryNoteDetail detail = new InventoryNoteDetail();
        detail.setBatchCode(batchCode);
        detail.setProductId(productId);
        detail.setProductSku("SKU-" + productId);
        detail.setProductName("Product " + productId);
        detail.setQuantity(quantity);
        detail.setQuantityInImportUnit(quantity);
        detail.setConversionRate(1);
        return detail;
    }
}
