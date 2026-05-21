package com.grocery.management.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.springframework.mock.http.client.MockClientHttpResponse;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.IOException;
import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;

class BearerTokenForwardingInterceptorTest {
    private final BearerTokenForwardingInterceptor interceptor = new BearerTokenForwardingInterceptor();

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void doesNotForwardBearerTokenWhenInternalServiceTokenIsPresent() throws IOException {
        setCurrentRequestBearerToken("user-token");
        MockClientHttpRequest request = new MockClientHttpRequest(
                HttpMethod.POST,
                URI.create("http://inventory-service:8085/api/inventory/reservations"));
        request.getHeaders().set("X-Internal-Service-Token", "internal-token");

        interceptor.intercept(request, new byte[0], (httpRequest, body) -> {
            assertThat(httpRequest.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)).isFalse();
            assertThat(httpRequest.getHeaders().getFirst("X-Internal-Service-Token")).isEqualTo("internal-token");
            return new MockClientHttpResponse(new byte[0], HttpStatus.OK);
        });
    }

    @Test
    void forwardsBearerTokenForRegularServiceRequest() throws IOException {
        setCurrentRequestBearerToken("user-token");
        MockClientHttpRequest request = new MockClientHttpRequest(
                HttpMethod.GET,
                URI.create("http://inventory-service:8085/api/stocks/summary"));

        interceptor.intercept(request, new byte[0], (httpRequest, body) -> {
            assertThat(httpRequest.getHeaders().getFirst(HttpHeaders.AUTHORIZATION)).isEqualTo("Bearer user-token");
            return new MockClientHttpResponse(new byte[0], HttpStatus.OK);
        });
    }

    private void setCurrentRequestBearerToken(String token) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }
}
