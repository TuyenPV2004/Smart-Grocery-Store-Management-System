package com.grocery.management.repository;

import com.grocery.management.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findByCode(String code);

    List<Voucher> findByStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(String status, LocalDateTime nowStart,
            LocalDateTime nowEnd);
}
