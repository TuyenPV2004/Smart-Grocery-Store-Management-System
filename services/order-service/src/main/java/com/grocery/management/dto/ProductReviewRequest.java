package com.grocery.management.dto;

import lombok.Data;

@Data
public class ProductReviewRequest {
    private Long parentReviewId;
    private int rating;
    private String comment;
}
