package com.grocery.management.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grocery.management.dto.StockChangedEvent;
import com.grocery.management.entity.InventoryOutboxEvent;
import com.grocery.management.repository.InventoryOutboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryOutboxPublisher {
    private final InventoryOutboxEventRepository outboxEventRepository;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;

    @Value("${app.messaging.inventory.exchange}")
    private String exchange;

    @Value("${app.messaging.inventory.stock-changed-routing-key}")
    private String stockChangedRoutingKey;

    @Value("${app.outbox.publisher.enabled:true}")
    private boolean enabled;

    @Value("${app.outbox.publisher.batch-size:50}")
    private int batchSize;

    @Value("${app.outbox.publisher.max-retries:10}")
    private int maxRetries;

    @Value("${app.outbox.publisher.processing-timeout:2m}")
    private Duration processingTimeout;

    @Scheduled(fixedDelayString = "${app.outbox.publisher.fixed-delay:5s}")
    public void publishPendingEvents() {
        if (!enabled) {
            return;
        }
        Instant staleBefore = Instant.now().minus(processingTimeout);
        List<InventoryOutboxEvent> events = outboxEventRepository.findPublishable(
                staleBefore,
                PageRequest.of(0, Math.max(1, batchSize)));
        for (InventoryOutboxEvent event : events) {
            if (!claim(event.getId(), staleBefore)) {
                continue;
            }
            publishClaimedEvent(event.getId());
        }
    }

    private boolean claim(Long eventId, Instant staleBefore) {
        return Boolean.TRUE.equals(transactionTemplate.execute(status ->
                outboxEventRepository.claim(eventId, Instant.now(), staleBefore) == 1));
    }

    protected void publishClaimedEvent(Long eventId) {
        InventoryOutboxEvent event = outboxEventRepository.findById(eventId).orElse(null);
        if (event == null) {
            return;
        }
        try {
            rabbitTemplate.convertAndSend(exchange, stockChangedRoutingKey, toMessage(event));
            markSent(event);
        } catch (Exception ex) {
            markFailedOrPending(event, ex);
        }
    }

    private StockChangedEvent toMessage(InventoryOutboxEvent event) throws JsonProcessingException {
        return objectMapper.readValue(event.getPayload(), StockChangedEvent.class);
    }

    private void markSent(InventoryOutboxEvent event) {
        transactionTemplate.executeWithoutResult(status -> {
            InventoryOutboxEvent current = outboxEventRepository.findById(event.getId()).orElseThrow();
            current.setStatus(InventoryOutboxEvent.SENT);
            current.setSentAt(Instant.now());
            current.setLastError(null);
            outboxEventRepository.save(current);
        });
    }

    private void markFailedOrPending(InventoryOutboxEvent event, Exception ex) {
        transactionTemplate.executeWithoutResult(status -> {
            InventoryOutboxEvent current = outboxEventRepository.findById(event.getId()).orElseThrow();
            int retryCount = current.getRetryCount() == null ? 0 : current.getRetryCount();
            current.setRetryCount(retryCount + 1);
            current.setStatus(current.getRetryCount() >= maxRetries ? InventoryOutboxEvent.FAILED : InventoryOutboxEvent.PENDING);
            current.setLastError(truncate(ex.getMessage()));
            outboxEventRepository.save(current);
        });
    }

    private String truncate(String value) {
        if (value == null) {
            return null;
        }
        return value.length() <= 1000 ? value : value.substring(0, 1000);
    }
}
