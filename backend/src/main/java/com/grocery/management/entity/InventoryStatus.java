package com.grocery.management.entity;

public enum InventoryStatus {
    DRAFT,      // Nháp - Chưa ảnh hưởng tồn kho
    COMPLETED,  // Hoàn thành - Đã cộng/trừ tồn kho
    CANCELLED   // Đã hủy - Vô hiệu hóa phiếu
}