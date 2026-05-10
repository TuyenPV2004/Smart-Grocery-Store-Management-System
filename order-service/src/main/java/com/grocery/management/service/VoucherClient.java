package com.grocery.management.service;

import com.grocery.management.dto.VoucherValidationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class VoucherClient {
    private final RestTemplate restTemplate;

    @Value("${voucher.service.base-url}")
    private String voucherServiceBaseUrl;

    public VoucherValidationResponse validate(String code) {
        ResponseEntity<VoucherValidationResponse> response = restTemplate.exchange(
                voucherServiceBaseUrl + "/api/vouchers/validate?code={code}",
                HttpMethod.POST,
                null,
                VoucherValidationResponse.class,
                code);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Voucher khong hop le: " + code);
        }
        return response.getBody();
    }

    public void commitUsage(String code, String orderCode) {
        if (code == null || code.isBlank()) {
            return;
        }
        ResponseEntity<String> response = restTemplate.exchange(
                voucherServiceBaseUrl + "/api/vouchers/" + code + "/commit-usage?orderCode={orderCode}",
                HttpMethod.POST,
                null,
                String.class,
                orderCode);
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Khong the commit voucher cho don hang: " + orderCode);
        }
    }
}
