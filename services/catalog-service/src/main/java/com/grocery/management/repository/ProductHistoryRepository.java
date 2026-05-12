package com.grocery.management.repository;

import com.grocery.management.entity.ProductHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductHistoryRepository extends JpaRepository<ProductHistory, Long> {
    List<ProductHistory> findByProductIdOrderByTimestampDesc(Long productId);
}