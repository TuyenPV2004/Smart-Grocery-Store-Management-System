package com.grocery.management.repository;

import com.grocery.management.entity.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    List<ProductReview> findAllByOrderByCreatedAtDesc();

    List<ProductReview> findByProductIdOrderByCreatedAtDesc(Long productId);

    Optional<ProductReview> findByProductIdAndUsername(Long productId, String username);

    boolean existsByIdAndProductId(Long id, Long productId);
}
