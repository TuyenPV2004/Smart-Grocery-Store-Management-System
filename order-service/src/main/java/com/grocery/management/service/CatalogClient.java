package com.grocery.management.service;

import com.grocery.management.dto.ProductSnapshotResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

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

    public long countProducts() {
        ResponseEntity<Map> response = restTemplate.exchange(
                catalogServiceBaseUrl + "/api/products?page=0&size=1",
                HttpMethod.GET,
                null,
                Map.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            return 0L;
        }
        Object totalElements = response.getBody().get("totalElements");
        if (totalElements instanceof Number number) {
            return number.longValue();
        }
        return 0L;
    }
}
