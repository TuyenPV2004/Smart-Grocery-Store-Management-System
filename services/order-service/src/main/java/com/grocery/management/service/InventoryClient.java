package com.grocery.management.service;

import com.grocery.management.dto.InventoryReservationRequest;
import com.grocery.management.dto.BatchExpiryDTO;
import com.grocery.management.dto.StockSummaryDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryClient {
    private final RestTemplate restTemplate;

    @Value("${inventory.service.base-url}")
    private String inventoryServiceBaseUrl;

    @Value("${inventory.service.internal-token}")
    private String internalServiceToken;

    public void reserve(String orderCode, InventoryReservationRequest request) {
        ResponseEntity<String> response = restTemplate.exchange(
                inventoryServiceBaseUrl + "/api/inventory/reservations",
                HttpMethod.POST,
                new HttpEntity<>(request, internalHeaders()),
                String.class);
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Khong the reserve ton kho cho don hang: " + orderCode);
        }
    }

    public void commit(String orderCode) {
        exchange(orderCode, "commit");
    }

    public void release(String orderCode) {
        exchange(orderCode, "release");
    }

    public List<StockSummaryDTO> getStockSummary() {
        ResponseEntity<List<StockSummaryDTO>> response = restTemplate.exchange(
                inventoryServiceBaseUrl + "/api/stocks/summary",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {
                });
        return response.getBody() != null ? response.getBody() : List.of();
    }

    public List<BatchExpiryDTO> getBatchesWithExpiryStatus() {
        ResponseEntity<List<BatchExpiryDTO>> response = restTemplate.exchange(
                inventoryServiceBaseUrl + "/api/stocks/batches/expiry",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {
                });
        return response.getBody() != null ? response.getBody() : List.of();
    }

    private void exchange(String orderCode, String action) {
        ResponseEntity<String> response = restTemplate.exchange(
                inventoryServiceBaseUrl + "/api/inventory/reservations/" + orderCode + "/" + action,
                HttpMethod.POST,
                new HttpEntity<>(internalHeaders()),
                String.class);
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Khong the " + action + " ton kho cho don hang: " + orderCode);
        }
    }

    private HttpHeaders internalHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Service-Token", internalServiceToken);
        return headers;
    }
}
