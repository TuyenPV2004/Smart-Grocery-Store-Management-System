package com.grocery.management.service;

import com.grocery.management.dto.StockChangedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StockEventPublisher {
    private final RabbitTemplate rabbitTemplate;

    @Value("${app.messaging.inventory.exchange}")
    private String exchange;

    @Value("${app.messaging.inventory.stock-changed-routing-key}")
    private String stockChangedRoutingKey;

    public void publishStockChanged(StockChangedEvent event) {
        rabbitTemplate.convertAndSend(exchange, stockChangedRoutingKey, event);
    }
}
