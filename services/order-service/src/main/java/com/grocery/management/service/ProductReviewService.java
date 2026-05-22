package com.grocery.management.service;

import com.grocery.management.dto.AuthenticatedUserProfile;
import com.grocery.management.dto.ProductReviewDTO;
import com.grocery.management.dto.ProductReviewReplyRequest;
import com.grocery.management.dto.ProductReviewRequest;
import com.grocery.management.entity.ProductReview;
import com.grocery.management.repository.OrderRepository;
import com.grocery.management.repository.ProductReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductReviewService {
    private final ProductReviewRepository productReviewRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public List<ProductReviewDTO> getAllReviews() {
        return productReviewRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(ProductReviewDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductReviewDTO> getReviews(Long productId) {
        return productReviewRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(ProductReviewDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean canReview(Long productId, AuthenticatedUserProfile user) {
        return hasPurchased(productId, user);
    }

    @Transactional
    public ProductReviewDTO createReview(Long productId, ProductReviewRequest request, AuthenticatedUserProfile user) {
        if (!hasPurchased(productId, user)) {
            throw new RuntimeException("Ban chi co the danh gia san pham da mua va hoan tat don hang");
        }

        String comment = request.getComment() == null ? "" : request.getComment().trim();
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new RuntimeException("Danh gia phai tu 1 den 5 sao");
        }
        if (comment.isBlank()) {
            throw new RuntimeException("Vui long nhap binh luan");
        }
        if (request.getParentReviewId() != null
                && !productReviewRepository.existsByIdAndProductId(request.getParentReviewId(), productId)) {
            throw new RuntimeException("Khong tim thay binh luan can tra loi");
        }

        LocalDateTime now = LocalDateTime.now();
        ProductReview review = new ProductReview();
        review.setProductId(productId);
        review.setParentReviewId(request.getParentReviewId());
        review.setUserId(user.getId());
        review.setUsername(user.getUsername());
        review.setCustomerName(firstNonBlank(user.getFullName(), user.getUsername()));
        review.setRating(request.getRating());
        review.setComment(comment);
        review.setCreatedAt(now);
        review.setUpdatedAt(now);
        return ProductReviewDTO.from(productReviewRepository.save(review));
    }

    @Transactional
    public ProductReviewDTO reply(Long reviewId, ProductReviewReplyRequest request, AuthenticatedUserProfile user) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay danh gia"));
        String reply = request.getReply() == null ? "" : request.getReply().trim();
        if (reply.isBlank()) {
            throw new RuntimeException("Vui long nhap noi dung phan hoi");
        }

        LocalDateTime now = LocalDateTime.now();
        review.setAdminReply(reply);
        review.setRepliedBy(firstNonBlank(user.getFullName(), user.getUsername()));
        review.setRepliedAt(now);
        review.setUpdatedAt(now);
        return ProductReviewDTO.from(productReviewRepository.save(review));
    }

    private boolean hasPurchased(Long productId, AuthenticatedUserProfile user) {
        return orderRepository.existsCompletedPurchaseForProduct(productId, user.getUsername(), user.getId());
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }
}
