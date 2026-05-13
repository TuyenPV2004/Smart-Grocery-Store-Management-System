CREATE TABLE IF NOT EXISTS inventory_notes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    code VARCHAR(255) NOT NULL,
    type ENUM('IMPORT', 'EXPORT'),
    supplier_id BIGINT,
    supplier_code VARCHAR(255),
    supplier_name VARCHAR(255),
    created_by_user_id BIGINT,
    created_by_staff_code VARCHAR(255),
    created_by_username VARCHAR(255),
    created_by_full_name VARCHAR(255),
    total_amount DECIMAL(38, 2),
    note VARCHAR(255),
    created_at DATETIME(6),
    import_date DATETIME(6),
    status ENUM('DRAFT', 'COMPLETED', 'CANCELLED'),
    discount DECIMAL(38, 2),
    vat DECIMAL(38, 2),
    final_amount DECIMAL(38, 2),
    amount_paid DECIMAL(38, 2),
    customer_name VARCHAR(255),
    export_reason VARCHAR(255),
    payment_status VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT uk_inventory_notes_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_note_details (
    id BIGINT NOT NULL AUTO_INCREMENT,
    note_id BIGINT NOT NULL,
    product_id BIGINT,
    product_sku VARCHAR(255),
    product_name VARCHAR(255),
    product_unit VARCHAR(255),
    product_brand VARCHAR(255),
    product_thumbnail VARCHAR(255),
    quantity INT NOT NULL,
    quantity_in_import_unit INT NOT NULL,
    import_unit VARCHAR(255),
    conversion_rate INT NOT NULL,
    import_price DECIMAL(38, 2),
    actual_price DECIMAL(38, 2),
    item_discount DECIMAL(38, 2),
    manufacturing_date DATE,
    expiry_date DATE,
    batch_code VARCHAR(255),
    origin VARCHAR(255),
    PRIMARY KEY (id),
    INDEX idx_inventory_note_details_note_id (note_id),
    CONSTRAINT fk_inventory_note_details_note
        FOREIGN KEY (note_id) REFERENCES inventory_notes (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_batches (
    id BIGINT NOT NULL AUTO_INCREMENT,
    batch_code VARCHAR(255) NOT NULL,
    product_id BIGINT,
    product_sku VARCHAR(255),
    product_name VARCHAR(255),
    product_unit VARCHAR(255),
    product_brand VARCHAR(255),
    product_thumbnail VARCHAR(255),
    supplier_id BIGINT,
    supplier_code VARCHAR(255),
    supplier_name VARCHAR(255),
    quantity INT,
    initial_quantity INT,
    manufacturing_date DATE,
    expiry_date DATE,
    import_price DECIMAL(38, 2),
    inventory_note_id BIGINT,
    inventory_note_code VARCHAR(255),
    conversion_rate INT,
    import_unit VARCHAR(255),
    quantity_in_import_unit INT,
    stock_in_import_unit INT,
    PRIMARY KEY (id),
    CONSTRAINT uk_product_batches_batch_code UNIQUE (batch_code),
    INDEX idx_product_batches_product_id (product_id),
    INDEX idx_product_batches_product_sku (product_sku),
    INDEX idx_product_batches_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_reservations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_code VARCHAR(255),
    status VARCHAR(255),
    created_at DATETIME(6),
    committed_at DATETIME(6),
    released_at DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_stock_reservations_order_code (order_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_reservation_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    reservation_id BIGINT NOT NULL,
    batch_id BIGINT,
    batch_code VARCHAR(255),
    product_id BIGINT,
    product_sku VARCHAR(255),
    product_name VARCHAR(255),
    quantity INT,
    PRIMARY KEY (id),
    INDEX idx_stock_reservation_items_reservation_id (reservation_id),
    INDEX idx_stock_reservation_items_product_id (product_id),
    CONSTRAINT fk_stock_reservation_items_reservation
        FOREIGN KEY (reservation_id) REFERENCES stock_reservations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
