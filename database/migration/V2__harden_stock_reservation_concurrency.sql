ALTER TABLE product_batches
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE stock_reservations
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE stock_reservations
    MODIFY order_code VARCHAR(255) NOT NULL;

ALTER TABLE stock_reservations
    ADD CONSTRAINT uk_stock_reservations_order_code UNIQUE (order_code);
