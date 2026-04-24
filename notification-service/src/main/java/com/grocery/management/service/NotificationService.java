package com.grocery.management.service;

import com.grocery.management.dto.EventEnvelope;
import com.grocery.management.dto.OrderCreatedEvent;
import com.grocery.management.entity.NotificationLog;
import com.grocery.management.repository.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationLogRepository notificationLogRepository;

    @Value("${app.messaging.order.created.queue}")
    private String queueName;

    @RabbitListener(queues = "${app.messaging.order.created.queue}")
    @Transactional
    public void consumeOrderCreated(EventEnvelope<OrderCreatedEvent> envelope) {
        if (envelope == null || envelope.getPayload() == null || envelope.getEventId() == null) {
            throw new RuntimeException("Message order created khong hop le");
        }

        if (notificationLogRepository.findByEventId(envelope.getEventId()).isPresent()) {
            log.info("notification duplicate event ignored eventId={}", envelope.getEventId());
            return;
        }

        OrderCreatedEvent payload = envelope.getPayload();
        NotificationLog notificationLog = new NotificationLog();
        notificationLog.setEventId(envelope.getEventId());
        notificationLog.setEventType(envelope.getEventType());
        notificationLog.setOrderId(payload.getOrderId());
        notificationLog.setUserId(payload.getUserId());
        notificationLog.setRecipient(payload.getEmail());
        notificationLog.setTitle("Don hang moi da duoc tao");
        notificationLog.setMessage("Don " + payload.getOrderCode() + " da duoc tao voi gia tri " + payload.getFinalAmount());
        notificationLog.setStatus("PROCESSED");
        notificationLog.setCreatedAt(payload.getCreatedAt() != null ? payload.getCreatedAt() : LocalDateTime.now());
        notificationLog.setProcessedAt(LocalDateTime.now());
        notificationLogRepository.save(notificationLog);

        log.info("notification processed queue={} eventId={} orderId={}", queueName, envelope.getEventId(), payload.getOrderId());
    }

    @Transactional(readOnly = true)
    public List<NotificationLog> getAllNotifications() {
        return notificationLogRepository.findAll();
    }

    @Transactional(readOnly = true)
    public NotificationLog getNotification(Long id) {
        return notificationLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay notification"));
    }
}
