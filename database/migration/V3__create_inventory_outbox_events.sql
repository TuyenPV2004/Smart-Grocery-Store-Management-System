CREATE TABLE IF NOT EXISTS inventory_outbox_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    aggregate_type VARCHAR(255) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(32) NOT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    locked_at DATETIME(6),
    sent_at DATETIME(6),
    last_error TEXT,
    PRIMARY KEY (id),
    CONSTRAINT uk_inventory_outbox_events_event_id UNIQUE (event_id),
    INDEX idx_inventory_outbox_status_created_at (status, created_at),
    INDEX idx_inventory_outbox_locked_at (locked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
