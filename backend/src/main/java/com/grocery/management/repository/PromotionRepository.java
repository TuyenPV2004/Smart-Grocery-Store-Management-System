package com.grocery.management.repository;

import com.grocery.management.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    @Query("SELECT DISTINCT p FROM Promotion p LEFT JOIN FETCH p.products WHERE p.status = 'ACTIVE' AND p.startDate <= :now AND p.endDate >= :now")
    List<Promotion> findActivePromotions(LocalDateTime now);
}
