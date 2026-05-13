package com.grocery.management.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Component
public class InternalServiceTokenFilter extends OncePerRequestFilter {
    public static final String HEADER_NAME = "X-Internal-Service-Token";

    @Value("${app.security.internal-service-token:}")
    private String internalServiceToken;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.equals("/api/inventory/reservations")
                && !path.startsWith("/api/inventory/reservations/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = request.getHeader(HEADER_NAME);
        if (internalServiceToken.isBlank() || !internalServiceToken.equals(token)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("""
                    {"code":"INTERNAL_SERVICE_TOKEN_REQUIRED","message":"Endpoint nay chi cho phep service noi bo goi","path":"%s","timestamp":"%s"}\
                    """.formatted(request.getRequestURI(), Instant.now()));
            return;
        }
        SecurityContextHolder.getContext().setAuthentication(new PreAuthenticatedAuthenticationToken(
                "order-service",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_INTERNAL_SERVICE"))));
        filterChain.doFilter(request, response);
    }
}
