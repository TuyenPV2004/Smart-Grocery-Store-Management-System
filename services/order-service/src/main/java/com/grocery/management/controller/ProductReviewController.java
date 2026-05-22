package com.grocery.management.controller;

import com.grocery.management.dto.AuthenticatedUserProfile;
import com.grocery.management.dto.ProductReviewReplyRequest;
import com.grocery.management.dto.ProductReviewRequest;
import com.grocery.management.service.ProductReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ProductReviewController {
    private final ProductReviewService productReviewService;

    @GetMapping
    public ResponseEntity<?> getAllReviews() {
        return ResponseEntity.ok(productReviewService.getAllReviews());
    }

    @GetMapping("/products/{productId}")
    public ResponseEntity<?> getProductReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(productReviewService.getReviews(productId));
    }

    @GetMapping("/products/{productId}/eligibility")
    public ResponseEntity<?> getReviewEligibility(@PathVariable Long productId, Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUserProfile user)) {
            return ResponseEntity.ok(Map.of("canReview", false));
        }
        return ResponseEntity.ok(Map.of("canReview", productReviewService.canReview(productId, user)));
    }

    @PostMapping("/products/{productId}")
    public ResponseEntity<?> createReview(
            @PathVariable Long productId,
            @RequestBody ProductReviewRequest request,
            Authentication authentication
    ) {
        try {
            AuthenticatedUserProfile user = (AuthenticatedUserProfile) authentication.getPrincipal();
            return ResponseEntity.ok(productReviewService.createReview(productId, request, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{reviewId}/reply")
    public ResponseEntity<?> reply(
            @PathVariable Long reviewId,
            @RequestBody ProductReviewReplyRequest request,
            Authentication authentication
    ) {
        try {
            AuthenticatedUserProfile user = (AuthenticatedUserProfile) authentication.getPrincipal();
            return ResponseEntity.ok(productReviewService.reply(reviewId, request, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
