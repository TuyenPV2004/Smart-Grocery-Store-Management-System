package com.grocery.management.service;

import com.grocery.management.dto.ProductSnapshotResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class CatalogClient {

    private final RestTemplate restTemplate;

    @Value("${catalog.service.base-url}")
    private String catalogServiceBaseUrl;

    public ProductSnapshotResponse getProductSnapshot(Long productId) {
        ResponseEntity<ProductSnapshotResponse> response = restTemplate.exchange(
                catalogServiceBaseUrl + "/api/products/" + productId + "/snapshot",
                HttpMethod.GET,
                null,
                ProductSnapshotResponse.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Khong the lay snapshot san pham: " + productId);
        }

        return response.getBody();
    }
}
