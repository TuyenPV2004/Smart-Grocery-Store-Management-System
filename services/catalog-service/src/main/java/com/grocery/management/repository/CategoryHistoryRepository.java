package com.grocery.management.repository;

import com.grocery.management.entity.CategoryHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryHistoryRepository extends JpaRepository<CategoryHistory, Long> {
    List<CategoryHistory> findByCategoryIdOrderByTimestampDesc(Long categoryId);
}