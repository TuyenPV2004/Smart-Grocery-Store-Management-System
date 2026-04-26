package com.grocery.management.repository;

import com.grocery.management.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    // Tìm mã NCC cuối cùng để sinh mã mới (VD: SUP005 -> SUP006)
    @Query(value = "SELECT code FROM suppliers ORDER BY id DESC LIMIT 1", nativeQuery = true)
    String findLastCode();

    Optional<Supplier> findByCode(String code);

    Optional<Supplier> findFirstByCode(String code);
}