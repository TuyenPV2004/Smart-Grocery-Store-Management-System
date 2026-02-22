package com.grocery.management.service;

import com.grocery.management.entity.Voucher;
import com.grocery.management.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;

    public List<Voucher> getAllVouchers() {
        return voucherRepository.findAll();
    }

    public List<Voucher> getActiveVouchers() {
        LocalDateTime now = LocalDateTime.now();
        return voucherRepository.findByStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual("ACTIVE", now, now);
    }

    public Voucher getVoucherById(Long id) {
        return voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found"));
    }

    public Voucher validateVoucher(String code) {
        Voucher voucher = voucherRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Mã voucher không tồn tại"));

        if (!"ACTIVE".equals(voucher.getStatus())) {
            throw new RuntimeException("Voucher đã bị vô hiệu hóa");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(voucher.getStartDate())) {
            throw new RuntimeException("Voucher chưa đến thời gian bắt đầu");
        }

        if (now.isAfter(voucher.getEndDate())) {
            throw new RuntimeException("Voucher đã hết hạn");
        }

        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new RuntimeException("Voucher đã hết số lượt sử dụng");
        }

        return voucher;
    }

    @Transactional
    public Voucher createVoucher(Voucher voucher) {
        if (voucherRepository.findByCode(voucher.getCode()).isPresent()) {
            throw new RuntimeException("Mã voucher đã tồn tại");
        }
        return voucherRepository.save(voucher);
    }

    @Transactional
    public Voucher updateVoucher(Long id, Voucher updatedDetails) {
        Voucher voucher = getVoucherById(id);
        voucher.setCode(updatedDetails.getCode());
        voucher.setDescription(updatedDetails.getDescription());
        voucher.setDiscountType(updatedDetails.getDiscountType());
        voucher.setDiscountValue(updatedDetails.getDiscountValue());
        voucher.setMinOrderValue(updatedDetails.getMinOrderValue());
        voucher.setMaxDiscountAmount(updatedDetails.getMaxDiscountAmount());
        voucher.setUsageLimit(updatedDetails.getUsageLimit());
        voucher.setStartDate(updatedDetails.getStartDate());
        voucher.setEndDate(updatedDetails.getEndDate());
        voucher.setStatus(updatedDetails.getStatus());
        return voucherRepository.save(voucher);
    }

    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = getVoucherById(id);
        voucherRepository.delete(voucher);
    }

    @Transactional
    public void incrementUsage(Long id) {
        Voucher voucher = getVoucherById(id);
        voucher.setUsedCount(voucher.getUsedCount() + 1);
        voucherRepository.save(voucher);
    }
}
