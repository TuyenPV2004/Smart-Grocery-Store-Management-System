package com.grocery.management.service;

import com.grocery.management.dto.AuthenticatedUserProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class AuthServiceClient {

    private final RestTemplate restTemplate;

    @Value("${auth.service.base-url}")
    private String authServiceBaseUrl;

    public AuthenticatedUserProfile getCurrentUser(String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, bearerToken);
        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        ResponseEntity<AuthenticatedUserProfile> response = restTemplate.exchange(
                authServiceBaseUrl + "/api/users/profile",
                HttpMethod.GET,
                requestEntity,
                AuthenticatedUserProfile.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Khong the xac dinh nguoi dung hien tai tu Auth Service");
        }

        return response.getBody();
    }
}
