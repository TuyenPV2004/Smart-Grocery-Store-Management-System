package com.grocery.management.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "inventory_outbox_events")
@Data
public class InventoryOutboxEvent {
    public static final String PENDING = "PENDING";
    public static final String PROCESSING = "PROCESSING";
    public static final String SENT = "SENT";
    public static final String FAILED = "FAILED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String eventId;

    @Column(nullable = false)
    private String eventType;

    @Column(nullable = false)
    private String aggregateType;

    @Column(nullable = false)
    private String aggregateId;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(nullable = false)
    private String status = PENDING;

    @Column(nullable = false)
    private Integer retryCount = 0;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant lockedAt;
    private Instant sentAt;

    @Column(columnDefinition = "TEXT")
    private String lastError;
}
