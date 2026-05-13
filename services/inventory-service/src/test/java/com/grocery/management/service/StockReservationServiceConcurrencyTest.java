package com.grocery.management.service;

import com.grocery.management.dto.StockReservationRequest;
import com.grocery.management.entity.ProductBatch;
import com.grocery.management.repository.ProductBatchRepository;
import com.grocery.management.repository.StockReservationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

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
class StockReservationServiceConcurrencyTest {
    private static final Long PRODUCT_ID = 900_001L;

    @Autowired
    private ProductBatchRepository productBatchRepository;

    @Autowired
    private StockReservationRepository reservationRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Test
    void concurrentReserveSameProductDoesNotOversell() throws Exception {
        newTransaction().executeWithoutResult(status -> productBatchRepository.save(batch(PRODUCT_ID, 1)));

        RedisDistributedLockService lockService = mock(RedisDistributedLockService.class);
        when(lockService.lockAll(any())).thenReturn(List.of());
        doNothing().when(lockService).releaseAfterTransaction(any());

        StockReservationService service = new StockReservationService(
                productBatchRepository,
                reservationRepository,
                mock(StockEventPublisher.class),
                lockService);

        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Future<Boolean> first = executor.submit(reserveTask(service, "ORDER-1", start));
            Future<Boolean> second = executor.submit(reserveTask(service, "ORDER-2", start));

            start.countDown();

            int successCount = (first.get() ? 1 : 0) + (second.get() ? 1 : 0);

            assertThat(successCount).isEqualTo(1);
            assertThat(productBatchRepository.getTotalQuantityByProductId(PRODUCT_ID)).isZero();
            assertThat(reservationRepository.findAll()).hasSize(1);
        }
    }

    private Callable<Boolean> reserveTask(StockReservationService service, String orderCode, CountDownLatch start) {
        return () -> {
            start.await();
            try {
                newTransaction().executeWithoutResult(status -> service.reserve(request(orderCode, PRODUCT_ID, 1)));
                return true;
            } catch (RuntimeException ex) {
                return false;
            }
        };
    }

    private TransactionTemplate newTransaction() {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return transactionTemplate;
    }

    private StockReservationRequest request(String orderCode, Long productId, int quantity) {
        StockReservationRequest request = new StockReservationRequest();
        request.setOrderCode(orderCode);
        StockReservationRequest.Item item = new StockReservationRequest.Item();
        item.setProductId(productId);
        item.setQuantity(quantity);
        request.setItems(List.of(item));
        return request;
    }

    private ProductBatch batch(Long productId, int quantity) {
        ProductBatch batch = new ProductBatch();
        batch.setBatchCode("BATCH-" + productId);
        batch.setProductId(productId);
        batch.setProductSku("SKU-" + productId);
        batch.setProductName("Product " + productId);
        batch.setQuantity(quantity);
        return batch;
    }
}
