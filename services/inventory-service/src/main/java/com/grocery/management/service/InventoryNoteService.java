package com.grocery.management.service;

import com.grocery.management.dto.InventoryNoteRequest;
import com.grocery.management.entity.InventoryNote;
import com.grocery.management.entity.InventoryNoteDetail;
import com.grocery.management.entity.InventoryStatus;
import com.grocery.management.entity.InventoryType;
import com.grocery.management.entity.ProductBatch;
import com.grocery.management.exception.InvalidInventoryRequestException;
import com.grocery.management.exception.InventoryNoteNotFoundException;
import com.grocery.management.exception.ProductBatchNotFoundException;
import com.grocery.management.exception.StockNotEnoughException;
import com.grocery.management.repository.InventoryNoteRepository;
import com.grocery.management.repository.ProductBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryNoteService {
    private final InventoryNoteRepository inventoryNoteRepository;
    private final ProductBatchRepository productBatchRepository;
    private final InventoryEventPublisher inventoryEventPublisher;
    private final RedisDistributedLockService redisLockService;

    public InventoryNote createBaseNote(InventoryNoteRequest request, String username, InventoryType type) {
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
        note.setDiscount(InventoryMoney.defaultMoney(request.getDiscount()));
        note.setVat(InventoryMoney.defaultMoney(request.getVat()));
        note.setAmountPaid(InventoryMoney.defaultMoney(request.getAmountPaid()));
        note.setCustomerName(request.getCustomerName());
        note.setExportReason(request.getExportReason());
        note.setPaymentStatus("PAID");
        return note;
    }

    public List<InventoryNote> getAllNotes() {
        return inventoryNoteRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public InventoryNote getNoteById(long id) {
        return inventoryNoteRepository.findById(id)
                .orElseThrow(() -> new InventoryNoteNotFoundException("Khong tim thay phieu: " + id));
    }

    @Transactional
    public void deleteNote(long id) {
        InventoryNote note = getNoteById(id);
        if (InventoryStatus.CANCELLED.equals(note.getStatus())) {
            return;
        }
        if (!InventoryStatus.COMPLETED.equals(note.getStatus())) {
            inventoryNoteRepository.delete(note);
            return;
        }

        List<RedisDistributedLockService.LockLease> leases = redisLockService.lockAll(cancelLockKeys(note));
        redisLockService.releaseAfterTransaction(leases);

        if (InventoryType.IMPORT.equals(note.getType())) {
            revertImportNote(note);
        } else if (InventoryType.EXPORT.equals(note.getType())) {
            revertExportNote(note);
        } else {
            throw new InvalidInventoryRequestException("Loai phieu khong ho tro huy: " + note.getType());
        }

        note.setStatus(InventoryStatus.CANCELLED);
        inventoryNoteRepository.save(note);
    }

    private void revertImportNote(InventoryNote note) {
        for (InventoryNoteDetail detail : safeDetails(note)) {
            ProductBatch batch = getBatch(detail);
            int quantity = safeQuantity(detail.getQuantity());
            if (safeQuantity(batch.getQuantity()) < quantity) {
                throw new StockNotEnoughException("Khong the huy phieu nhap vi lo hang '" + detail.getBatchCode() + "' da xuat mot phan");
            }
            batch.setQuantity(safeQuantity(batch.getQuantity()) - quantity);
            productBatchRepository.save(batch);
            inventoryEventPublisher.publishStockChanged(batch, -quantity, note, "IMPORT_CANCELLED");
        }
    }

    private void revertExportNote(InventoryNote note) {
        for (InventoryNoteDetail detail : safeDetails(note)) {
            ProductBatch batch = getBatch(detail);
            int quantity = safeQuantity(detail.getQuantity());
            batch.setQuantity(safeQuantity(batch.getQuantity()) + quantity);
            productBatchRepository.save(batch);
            inventoryEventPublisher.publishStockChanged(batch, quantity, note, "EXPORT_CANCELLED");
        }
    }

    private ProductBatch getBatch(InventoryNoteDetail detail) {
        if (detail.getBatchCode() == null || detail.getBatchCode().isBlank()) {
            throw new InvalidInventoryRequestException("Chi tiet phieu khong co ma lo hang de hoan tac");
        }
        return productBatchRepository.findByBatchCode(detail.getBatchCode())
                .orElseThrow(() -> new ProductBatchNotFoundException("Khong tim thay lo hang: " + detail.getBatchCode()));
    }

    private List<String> cancelLockKeys(InventoryNote note) {
        return safeDetails(note).stream()
                .map(InventoryNoteDetail::getProductId)
                .filter(productId -> productId != null)
                .map(productId -> "stock:product:" + productId)
                .toList();
    }

    private List<InventoryNoteDetail> safeDetails(InventoryNote note) {
        return note.getDetails() != null ? note.getDetails() : List.of();
    }

    private int safeQuantity(Integer value) {
        return value != null ? value : 0;
    }
}
