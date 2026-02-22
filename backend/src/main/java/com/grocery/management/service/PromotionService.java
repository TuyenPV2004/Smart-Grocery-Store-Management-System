package com.grocery.management.service;

import com.grocery.management.entity.Promotion;
import com.grocery.management.entity.Product;
import com.grocery.management.repository.PromotionRepository;
import com.grocery.management.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromotionService {
    private final PromotionRepository promotionRepository;
    private final ProductRepository productRepository;

    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }

    public Promotion getPromotionById(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chương trình khuyến mãi"));
    }

    public Promotion createPromotion(Promotion promotion, List<Long> productIds) {
        if (productIds != null && !productIds.isEmpty()) {
            Set<Product> products = productIds.stream()
                    .map(id -> productRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Sản phẩm không hợp lệ: " + id)))
                    .collect(Collectors.toSet());
            promotion.setProducts(products);
        }
        return promotionRepository.save(promotion);
    }

    public Promotion updatePromotion(@NonNull Long id, Promotion input, List<Long> productIds) {
        Promotion existing = getPromotionById(id);
        existing.setName(input.getName());
        existing.setDescription(input.getDescription());
        existing.setDiscountType(input.getDiscountType());
        existing.setDiscountValue(input.getDiscountValue());
        existing.setStartDate(input.getStartDate());
        existing.setEndDate(input.getEndDate());
        existing.setStatus(input.getStatus());

        if (productIds != null) {
            Set<Product> products = productIds.stream()
                    .map(pId -> productRepository.findById(pId)
                            .orElseThrow(() -> new RuntimeException("Sản phẩm không hợp lệ: " + pId)))
                    .collect(Collectors.toSet());
            existing.setProducts(products);
        } else {
            existing.getProducts().clear();
        }

        return promotionRepository.save(existing);
    }

    public void deletePromotion(@NonNull Long id) {
        Promotion existing = getPromotionById(id);
        promotionRepository.delete(existing);
    }
}
