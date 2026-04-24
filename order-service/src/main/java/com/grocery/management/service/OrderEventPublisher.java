package com.grocery.management.service;

import com.grocery.management.dto.EventEnvelope;
import com.grocery.management.dto.OrderCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.messaging.order.exchange}")
    private String exchangeName;

    @Value("${app.messaging.order.created.routing-key}")
    private String orderCreatedRoutingKey;

    public void publishOrderCreated(OrderCreatedEvent event) {
        rabbitTemplate.convertAndSend(
                exchangeName,
                orderCreatedRoutingKey,
                EventEnvelope.of("OrderCreated", String.valueOf(event.getOrderId()), event));
    }
}
