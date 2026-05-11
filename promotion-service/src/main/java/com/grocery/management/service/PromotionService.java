package com.grocery.management.service;

import com.grocery.management.dto.ProductSnapshot;
import com.grocery.management.entity.Promotion;
import com.grocery.management.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromotionService {
    private final PromotionRepository promotionRepository;
    private final CatalogClient catalogClient;

    public List<Promotion> getAllPromotions() {
        return enrichProducts(promotionRepository.findAll());
    }

    public Promotion getPromotionById(Long id) {
        return enrichProducts(promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay chuong trinh khuyen mai")));
    }

    public Promotion createPromotion(Promotion promotion, List<Long> productIds) {
        promotion.setProductIds(normalizeProductIds(productIds));
        return enrichProducts(promotionRepository.save(promotion));
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
        existing.setProductIds(normalizeProductIds(productIds));

        return enrichProducts(promotionRepository.save(existing));
    }

    public void deletePromotion(@NonNull Long id) {
        Promotion existing = getPromotionById(id);
        promotionRepository.delete(existing);
    }

    private HashSet<Long> normalizeProductIds(List<Long> productIds) {
        if (productIds == null) {
            return new HashSet<>();
        }
        return productIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private List<Promotion> enrichProducts(List<Promotion> promotions) {
        List<Long> productIds = promotions.stream()
                .flatMap(promotion -> promotion.getProductIds().stream())
                .distinct()
                .toList();
        Map<Long, ProductSnapshot> snapshots = catalogClient.getProductsById(productIds).stream()
                .collect(Collectors.toMap(ProductSnapshot::id, Function.identity(), (left, right) -> left));

        promotions.forEach(promotion -> promotion.setProducts(promotion.getProductIds().stream()
                .map(snapshots::get)
                .filter(Objects::nonNull)
                .toList()));
        return promotions;
    }

    private Promotion enrichProducts(Promotion promotion) {
        return enrichProducts(List.of(promotion)).getFirst();
    }
}
