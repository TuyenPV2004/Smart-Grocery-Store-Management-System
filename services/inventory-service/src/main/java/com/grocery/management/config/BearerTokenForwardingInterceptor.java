package com.grocery.management.config;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class BearerTokenForwardingInterceptor implements ClientHttpRequestInterceptor {

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution)
            throws IOException {
        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            String token = currentBearerToken();
            if (token != null) {
                request.getHeaders().setBearerAuth(token);
            }
        }
        return execution.execute(request, body);
    }

    private String currentBearerToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        Object credentials = authentication.getCredentials();
        if (credentials instanceof String token && !token.isBlank()) {
            return token;
        }
        if (credentials instanceof Jwt jwt) {
            return jwt.getTokenValue();
        }
        return null;
    }
}
