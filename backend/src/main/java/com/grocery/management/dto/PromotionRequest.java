package com.grocery.management.dto;

import com.grocery.management.entity.Promotion;
import lombok.Data;
import java.util.List;

@Data
public class PromotionRequest {
    private Promotion promotion;
    private List<Long> productIds;
}
