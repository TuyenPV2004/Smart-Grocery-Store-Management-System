package com.grocery.management.service;

import com.grocery.management.dto.ProductSnapshot;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogClient {
    private final RestTemplate restTemplate;

    @Value("${catalog.service.base-url}")
    private String catalogServiceBaseUrl;

    public List<ProductSnapshot> getProductsById(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return List.of();
        }

        List<ProductSnapshot> snapshots = new ArrayList<>();
        for (Long productId : productIds) {
            try {
                ResponseEntity<ProductSnapshot> response = restTemplate.exchange(
                        catalogServiceBaseUrl + "/api/products/{id}",
                        HttpMethod.GET,
                        null,
                        ProductSnapshot.class,
                        productId);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    snapshots.add(response.getBody());
                }
            } catch (RestClientException ignored) {
            }
        }
        return snapshots;
    }
}
