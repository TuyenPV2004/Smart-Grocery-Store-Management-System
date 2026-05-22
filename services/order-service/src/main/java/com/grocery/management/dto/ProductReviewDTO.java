package com.grocery.management.dto;

import com.grocery.management.entity.ProductReview;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProductReviewDTO {
    private Long id;
    private Long productId;
    private Long parentReviewId;
    private String username;
    private String customerName;
    private int rating;
    private String comment;
    private String adminReply;
    private String repliedBy;
    private LocalDateTime repliedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProductReviewDTO from(ProductReview review) {
        return ProductReviewDTO.builder()
                .id(review.getId())
                .productId(review.getProductId())
                .parentReviewId(review.getParentReviewId())
                .username(review.getUsername())
                .customerName(review.getCustomerName())
                .rating(review.getRating())
                .comment(review.getComment())
                .adminReply(review.getAdminReply())
                .repliedBy(review.getRepliedBy())
                .repliedAt(review.getRepliedAt())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
