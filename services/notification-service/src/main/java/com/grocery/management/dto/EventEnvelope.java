package com.grocery.management.dto;

import lombok.Data;

import java.time.Instant;

@Data
public class EventEnvelope<T> {
    private String eventId;
    private String eventType;
    private Instant occurredAt;
    private String aggregateId;
    private T payload;
}
