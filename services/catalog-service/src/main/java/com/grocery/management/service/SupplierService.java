package com.grocery.management.service;

import com.grocery.management.entity.Supplier;
import com.grocery.management.repository.ProductRepository;
import com.grocery.management.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.lang.NonNull;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierService {
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final CloudinaryImageService cloudinaryImageService;

    /**
     * Lấy danh sách tất cả nhà cung cấp
     */
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    /**
     * Tìm nhà cung cấp theo ID
     */
    public Supplier getSupplierById(@NonNull Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nhà cung cấp không tồn tại"));
    }

    /**
     * Tạo mới nhà cung cấp
     */
    @Transactional
    public Supplier createSupplier(Supplier supplier) {
        return createSupplier(supplier, null);
    }

    @Transactional
    public Supplier createSupplier(Supplier supplier, MultipartFile logoFile) {
        // 1. Check trùng lặp SĐT và Email
        if (supplierRepository.existsByPhone(supplier.getPhone())) {
            throw new RuntimeException("Số điện thoại này đã tồn tại!");
        }
        if (supplier.getEmail() != null && !supplier.getEmail().isEmpty()
                && supplierRepository.existsByEmail(supplier.getEmail())) {
            throw new RuntimeException("Email này đã tồn tại!");
        }

        // 2. Sinh mã tự động (Logic: SUP + 3 số)
        String lastCode = supplierRepository.findLastCode();
        supplier.setCode(generateNextCode(lastCode));

        supplier.setActive(true);
        uploadLogoIfPresent(supplier, logoFile);
        return supplierRepository.save(supplier);
    }

    /**
     * Cập nhật thông tin nhà cung cấp (Đã cập nhật các trường tên mới)
     */
    @Transactional
    public Supplier updateSupplier(@NonNull Long id, Supplier request) {
        return updateSupplier(id, request, null);
    }

    @Transactional
    public Supplier updateSupplier(@NonNull Long id, Supplier request, MultipartFile logoFile) {
        Supplier existing = getSupplierById(id);

        // Check trùng SĐT nếu thay đổi
        if (!existing.getPhone().equals(request.getPhone()) && supplierRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Số điện thoại mới đã được sử dụng!");
        }

        // --- CẬP NHẬT CÁC TRƯỜNG TÊN MỚI ---
        existing.setVietnameseName(request.getVietnameseName());
        existing.setEnglishName(request.getEnglishName());
        existing.setTradingName(request.getTradingName());
        existing.setBrand(request.getBrand());
        // ------------------------------------

        existing.setPhone(request.getPhone());
        existing.setEmail(request.getEmail());
        existing.setAddress(request.getAddress());
        if (request.getLogoUrl() != null) {
            existing.setLogoUrl(request.getLogoUrl());
        }
        existing.setTaxCode(request.getTaxCode());
        existing.setNote(request.getNote());
        uploadLogoIfPresent(existing, logoFile);

        return supplierRepository.save(existing);
    }

    private void uploadLogoIfPresent(Supplier supplier, MultipartFile logoFile) {
        if (logoFile == null || logoFile.isEmpty()) {
            return;
        }

        try {
            if (supplier.getLogoUrl() != null && !supplier.getLogoUrl().isBlank()) {
                cloudinaryImageService.deleteImageByUrl(supplier.getLogoUrl());
            }
            supplier.setLogoUrl(cloudinaryImageService.uploadSupplierLogo(logoFile));
        } catch (IOException e) {
            throw new RuntimeException("Khong the upload logo nha cung cap: " + e.getMessage());
        }
    }

    /**
     * Bật/Tắt trạng thái hoạt động (Soft Delete)
     */
    public void toggleStatus(@NonNull Long id) {
        Supplier supplier = getSupplierById(id);
        supplier.setActive(!supplier.isActive());
        supplierRepository.save(supplier);
    }

    @Transactional
    public void deleteSupplier(@NonNull Long id) {
        Supplier supplier = getSupplierById(id);
        if (productRepository.existsBySupplierId(id)) {
            throw new RuntimeException("Không thể xóa nhà cung cấp vì đang có sản phẩm liên kết");
        }
        supplierRepository.delete(supplier);
    }

    /**
     * Helper: Logic sinh mã SUP001, SUP002...
     */
    private String generateNextCode(String lastCode) {
        if (lastCode == null || lastCode.isEmpty()) {
            return "SUP001";
        }
        try {
            String numberPart = lastCode.replaceAll("\\D", ""); // Lấy phần số
            int number = Integer.parseInt(numberPart);
            return String.format("SUP%03d", number + 1);
        } catch (Exception e) {
            return "SUP" + System.currentTimeMillis(); // Fallback nếu lỗi
        }
    }
}
