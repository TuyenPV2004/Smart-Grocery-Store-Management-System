package com.grocery.management.config;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.IOException;

@Component
public class BearerTokenForwardingInterceptor implements ClientHttpRequestInterceptor {
    private static final String INTERNAL_SERVICE_TOKEN_HEADER = "X-Internal-Service-Token";

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution)
            throws IOException {
        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)
                && !request.getHeaders().containsKey(INTERNAL_SERVICE_TOKEN_HEADER)) {
            String token = currentBearerToken();
            if (token != null) {
                request.getHeaders().setBearerAuth(token);
            }
        }
        return execution.execute(request, body);
    }

    private String currentBearerToken() {
        String requestToken = currentRequestBearerToken();
        if (requestToken != null) {
            return requestToken;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            return jwtAuthenticationToken.getToken().getTokenValue();
        }
        Object credentials = authentication.getCredentials();
        if (credentials instanceof String token && !token.isBlank() && !"[PROTECTED]".equals(token)) {
            return token;
        }
        if (credentials instanceof Jwt jwt) {
            return jwt.getTokenValue();
        }
        return null;
    }

    private String currentRequestBearerToken() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)) {
            return null;
        }
        String authorization = attributes.getRequest().getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return null;
        }
        String token = authorization.substring(7).trim();
        return token.isEmpty() ? null : token;
    }
}
