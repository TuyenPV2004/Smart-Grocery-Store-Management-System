package com.grocery.management.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grocery.management.dto.StockChangedEvent;
import com.grocery.management.entity.InventoryOutboxEvent;
import com.grocery.management.repository.InventoryOutboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StockEventPublisher {
    private static final String STOCK_CHANGED_EVENT = "StockChangedEvent";
    private static final String PRODUCT_AGGREGATE = "Product";

    private final InventoryOutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    public void publishStockChanged(StockChangedEvent event) {
        InventoryOutboxEvent outboxEvent = new InventoryOutboxEvent();
        outboxEvent.setEventId(event.getEventId());
        outboxEvent.setEventType(STOCK_CHANGED_EVENT);
        outboxEvent.setAggregateType(PRODUCT_AGGREGATE);
        outboxEvent.setAggregateId(String.valueOf(event.getProductId()));
        outboxEvent.setPayload(toPayload(event));
        outboxEventRepository.save(outboxEvent);
    }

    private String toPayload(StockChangedEvent event) {
        try {
            return objectMapper.writeValueAsString(event);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Khong the serialize stock changed event", ex);
        }
    }
}
