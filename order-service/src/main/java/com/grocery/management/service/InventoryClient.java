package com.grocery.management.service;

import com.grocery.management.dto.InventoryReservationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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
