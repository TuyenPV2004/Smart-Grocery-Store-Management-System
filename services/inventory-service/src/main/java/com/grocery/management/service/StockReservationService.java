package com.grocery.management.service;

import com.grocery.management.dto.StockChangedEvent;
import com.grocery.management.dto.StockReservationRequest;
import com.grocery.management.dto.StockReservationResponse;
import com.grocery.management.entity.ProductBatch;
import com.grocery.management.entity.StockReservation;
import com.grocery.management.entity.StockReservationItem;
import com.grocery.management.exception.InvalidInventoryRequestException;
import com.grocery.management.exception.ProductBatchNotFoundException;
import com.grocery.management.exception.ReservationNotFoundException;
import com.grocery.management.exception.StockNotEnoughException;
import com.grocery.management.repository.ProductBatchRepository;
import com.grocery.management.repository.StockReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StockReservationService {
    private static final String RESERVED = "RESERVED";
    private static final String COMMITTED = "COMMITTED";
    private static final String RELEASED = "RELEASED";

    private final ProductBatchRepository productBatchRepository;
    private final StockReservationRepository reservationRepository;
    private final StockEventPublisher stockEventPublisher;
    private final RedisDistributedLockService redisLockService;

    @Transactional
    public StockReservationResponse reserve(StockReservationRequest request) {
        if (request.getOrderCode() == null || request.getOrderCode().isBlank()) {
            throw new InvalidInventoryRequestException("Ma don hang khong duoc de trong");
        }
        List<RedisDistributedLockService.LockLease> leases = redisLockService.lockAll(reserveLockKeys(request));
        redisLockService.releaseAfterTransaction(leases);

        return reservationRepository.findByOrderCode(request.getOrderCode())
                .map(this::toResponse)
                .orElseGet(() -> createReservation(request));
    }

    @Transactional
    public StockReservationResponse commit(String orderCode) {
        List<RedisDistributedLockService.LockLease> leases = redisLockService.lockAll(List.of(orderLockKey(orderCode)));
        redisLockService.releaseAfterTransaction(leases);

        StockReservation reservation = getReservation(orderCode);
        if (COMMITTED.equals(reservation.getStatus())) {
            return toResponse(reservation);
        }
        if (RELEASED.equals(reservation.getStatus())) {
            throw new InvalidInventoryRequestException("Ton kho da duoc hoan cho don hang: " + orderCode);
        }
        reservation.setStatus(COMMITTED);
        reservation.setCommittedAt(LocalDateTime.now());
        return toResponse(reservationRepository.save(reservation));
    }

    @Transactional
    public StockReservationResponse release(String orderCode) {
        List<RedisDistributedLockService.LockLease> orderLeases = redisLockService.lockAll(List.of(orderLockKey(orderCode)));
        redisLockService.releaseAfterTransaction(orderLeases);

        StockReservation reservation = getReservation(orderCode);
        List<RedisDistributedLockService.LockLease> productLeases = redisLockService.lockAll(productLockKeys(reservation));
        redisLockService.releaseAfterTransaction(productLeases);

        if (RELEASED.equals(reservation.getStatus()) || COMMITTED.equals(reservation.getStatus())) {
            return toResponse(reservation);
        }
        for (StockReservationItem item : reservation.getItems()) {
            ProductBatch batch = productBatchRepository.findById(item.getBatchId())
                    .orElseThrow(() -> new ProductBatchNotFoundException("Khong tim thay lo hang da reserve: " + item.getBatchCode()));
            batch.setQuantity(safeQuantity(batch.getQuantity()) + safeQuantity(item.getQuantity()));
            productBatchRepository.save(batch);
            publishStockChanged(batch, item.getQuantity(), reservation, "RESERVATION_RELEASED");
        }
        reservation.setStatus(RELEASED);
        reservation.setReleasedAt(LocalDateTime.now());
        return toResponse(reservationRepository.save(reservation));
    }

    private StockReservationResponse createReservation(StockReservationRequest request) {
        StockReservation reservation = new StockReservation();
        reservation.setOrderCode(request.getOrderCode());
        reservation.setStatus(RESERVED);
        reservation.setCreatedAt(LocalDateTime.now());

        List<StockReservationItem> reservationItems = new ArrayList<>();
        for (StockReservationRequest.Item item : request.getItems() != null ? request.getItems() : List.<StockReservationRequest.Item>of()) {
            int requestedQuantity = safeQuantity(item.getQuantity());
            if (item.getProductId() == null || requestedQuantity <= 0) {
                throw new InvalidInventoryRequestException("Thong tin san pham reserve khong hop le");
            }
            int remaining = requestedQuantity;
            List<ProductBatch> batches = productBatchRepository
                    .findByProductIdAndQuantityGreaterThanOrderByExpiryDateAsc(item.getProductId(), 0);
            for (ProductBatch batch : batches) {
                if (remaining <= 0) {
                    break;
                }
                int taken = Math.min(safeQuantity(batch.getQuantity()), remaining);
                batch.setQuantity(safeQuantity(batch.getQuantity()) - taken);
                productBatchRepository.save(batch);

                StockReservationItem reservationItem = new StockReservationItem();
                reservationItem.setReservation(reservation);
                reservationItem.setBatchId(batch.getId());
                reservationItem.setBatchCode(batch.getBatchCode());
                reservationItem.setProductId(batch.getProductId());
                reservationItem.setProductSku(batch.getProductSku());
                reservationItem.setProductName(batch.getProductName());
                reservationItem.setQuantity(taken);
                reservationItems.add(reservationItem);

                remaining -= taken;
            }
            if (remaining > 0) {
                int availableQuantity = requestedQuantity - remaining;
                throw new StockNotEnoughException("San pham " + item.getProductId() + " khong du ton kho. Ton kha dung: " + availableQuantity);
            }
        }
        reservation.setItems(reservationItems);
        StockReservation savedReservation = reservationRepository.save(reservation);
        for (StockReservationItem item : savedReservation.getItems()) {
            publishStockChanged(item, -safeQuantity(item.getQuantity()), savedReservation, "RESERVATION_CREATED");
        }
        return toResponse(savedReservation);
    }

    private StockReservation getReservation(String orderCode) {
        return reservationRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ReservationNotFoundException("Khong tim thay reservation cho don hang: " + orderCode));
    }

    private List<String> reserveLockKeys(StockReservationRequest request) {
        List<String> keys = new ArrayList<>();
        keys.add(orderLockKey(request.getOrderCode()));
        for (StockReservationRequest.Item item : request.getItems() != null ? request.getItems() : List.<StockReservationRequest.Item>of()) {
            if (item.getProductId() != null) {
                keys.add(productLockKey(item.getProductId()));
            }
        }
        return keys;
    }

    private List<String> productLockKeys(StockReservation reservation) {
        return reservation.getItems() == null ? List.of()
                : reservation.getItems().stream()
                        .map(StockReservationItem::getProductId)
                        .filter(productId -> productId != null)
                        .map(this::productLockKey)
                        .toList();
    }

    private String orderLockKey(String orderCode) {
        return "stock-reservation:order:" + orderCode;
    }

    private String productLockKey(Long productId) {
        return "stock:product:" + productId;
    }

    private StockReservationResponse toResponse(StockReservation reservation) {
        List<StockReservationResponse.Item> items = reservation.getItems() == null ? List.of()
                : reservation.getItems().stream()
                        .map(item -> new StockReservationResponse.Item(item.getProductId(), item.getProductSku(), item.getQuantity()))
                        .toList();
        return new StockReservationResponse(reservation.getOrderCode(), reservation.getStatus(), items);
    }

    private void publishStockChanged(ProductBatch batch, int delta, StockReservation reservation, String sourceType) {
        Integer currentQuantity = productBatchRepository.getTotalQuantityByProductId(batch.getProductId());
        stockEventPublisher.publishStockChanged(new StockChangedEvent(UUID.randomUUID().toString(), batch.getProductId(),
                batch.getProductSku(), batch.getProductName(), delta, currentQuantity, sourceType, reservation.getId(), Instant.now()));
    }

    private void publishStockChanged(StockReservationItem item, int delta, StockReservation reservation, String sourceType) {
        Integer currentQuantity = productBatchRepository.getTotalQuantityByProductId(item.getProductId());
        stockEventPublisher.publishStockChanged(new StockChangedEvent(UUID.randomUUID().toString(), item.getProductId(),
                item.getProductSku(), item.getProductName(), delta, currentQuantity, sourceType, reservation.getId(), Instant.now()));
    }

    private int safeQuantity(Integer value) {
        return value != null ? value : 0;
    }
}
