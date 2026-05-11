package com.grocery.management.service;

import com.grocery.management.dto.InventoryReservationRequest;
import com.grocery.management.dto.BatchExpiryDTO;
import com.grocery.management.dto.StockSummaryDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.beans.factory.annotation.Value;
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

    public void reserve(String orderCode, InventoryReservationRequest request) {
        ResponseEntity<String> response = restTemplate.postForEntity(
                inventoryServiceBaseUrl + "/api/inventory/reservations",
                request,
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
                null,
                String.class);
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Khong the " + action + " ton kho cho don hang: " + orderCode);
        }
    }
}
