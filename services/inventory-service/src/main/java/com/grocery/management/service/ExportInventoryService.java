package com.grocery.management.service;

import com.grocery.management.dto.InventoryNoteRequest;
import com.grocery.management.entity.InventoryNote;
import com.grocery.management.entity.InventoryNoteDetail;
import com.grocery.management.entity.InventoryType;
import com.grocery.management.entity.ProductBatch;
import com.grocery.management.exception.InvalidInventoryRequestException;
import com.grocery.management.exception.StockNotEnoughException;
import com.grocery.management.repository.InventoryNoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportInventoryService {
    private final InventoryNoteRepository inventoryNoteRepository;
    private final InventoryNoteService inventoryNoteService;
    private final InventoryBatchService inventoryBatchService;
    private final InventorySnapshotMapper snapshotMapper;
    private final InventoryEventPublisher eventPublisher;
    private final RedisDistributedLockService redisLockService;

    @Transactional
    public InventoryNote createExportNote(InventoryNoteRequest request, String username) {
        List<RedisDistributedLockService.LockLease> leases = redisLockService.lockAll(inventoryBatchService.exportLockKeys(request));
        redisLockService.releaseAfterTransaction(leases);

        InventoryNote note = inventoryNoteRepository.save(inventoryNoteService.createBaseNote(request, username, InventoryType.EXPORT));
        List<InventoryNoteDetail> details = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (InventoryNoteRequest.InventoryNoteDetailDto item : InventoryRequestSupport.safeDetails(request)) {
            if (item.getBatchCode() == null || item.getBatchCode().isBlank()) {
                throw new InvalidInventoryRequestException("Ma lo hang khong duoc de trong");
            }
            ProductBatch batch = inventoryBatchService.getByBatchCode(item.getBatchCode());
            int quantity = item.getQuantity() != null ? item.getQuantity() : 0;
            if (batch.getQuantity() == null || batch.getQuantity() < quantity) {
                throw new StockNotEnoughException("Lo hang '" + item.getBatchCode() + "' khong du so luong");
            }
            batch.setQuantity(batch.getQuantity() - quantity);
            inventoryBatchService.save(batch);

            BigDecimal price = item.getImportPrice() != null ? item.getImportPrice() : InventoryMoney.defaultMoney(batch.getImportPrice());
            totalAmount = totalAmount.add(price.multiply(BigDecimal.valueOf(quantity)));

            InventoryNoteDetail detail = createDetail(note, batch, quantity, price);
            details.add(detail);
            eventPublisher.publishStockChanged(batch, -quantity, note, "EXPORT");
        }
        note.setDetails(details);
        note.setTotalAmount(totalAmount);
        note.setFinalAmount(totalAmount);
        return inventoryNoteRepository.save(note);
    }

    private InventoryNoteDetail createDetail(InventoryNote note, ProductBatch batch, int quantity, BigDecimal price) {
        InventoryNoteDetail detail = new InventoryNoteDetail();
        detail.setInventoryNote(note);
        snapshotMapper.applyBatch(detail, batch);
        detail.setQuantity(quantity);
        detail.setQuantityInImportUnit(quantity);
        detail.setConversionRate(1);
        detail.setImportUnit(batch.getProductUnit());
        detail.setManufacturingDate(batch.getManufacturingDate());
        detail.setExpiryDate(batch.getExpiryDate());
        detail.setBatchCode(batch.getBatchCode());
        detail.setImportPrice(price);
        detail.setActualPrice(price);
        return detail;
    }
}
