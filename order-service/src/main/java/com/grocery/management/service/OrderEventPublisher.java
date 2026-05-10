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

    @Value("${app.messaging.order.paid.routing-key}")
    private String orderPaidRoutingKey;

    @Value("${app.messaging.order.cancelled.routing-key}")
    private String orderCancelledRoutingKey;

    public void publishOrderCreated(OrderCreatedEvent event) {
        rabbitTemplate.convertAndSend(
                exchangeName,
                orderCreatedRoutingKey,
                EventEnvelope.of("OrderCreated", String.valueOf(event.getOrderId()), event));
    }

    public void publishOrderPaid(Long orderId, String orderCode) {
        rabbitTemplate.convertAndSend(
                exchangeName,
                orderPaidRoutingKey,
                EventEnvelope.of("OrderPaid", String.valueOf(orderId), orderCode));
    }

    public void publishOrderCancelled(Long orderId, String orderCode) {
        rabbitTemplate.convertAndSend(
                exchangeName,
                orderCancelledRoutingKey,
                EventEnvelope.of("OrderCancelled", String.valueOf(orderId), orderCode));
    }
}
