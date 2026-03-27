package com.grocery.management.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/api/v1/auth/**", "/product-images/**", "/user-photos/**").permitAll()
                        .requestMatchers("/user-photos/**").permitAll()
                        .requestMatchers("/product-images/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/products/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/products/*").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/categories/**").permitAll()
                        .requestMatchers("/api/v1/payment/vnpay_return", "/api/v1/payment/vnpay_ipn").permitAll()
                        .requestMatchers("/api/v1/chat/socket-ticket").permitAll()
                        .requestMatchers("/api/v1/chat/conversations/**", "/api/v1/chat/conversations")
                        .hasAnyAuthority("ADMIN", "STAFF")
                        .requestMatchers("/api/v1/chat/**").authenticated()
                        .requestMatchers("/api/v1/payment/create_payment/**").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/orders").authenticated()
                        .requestMatchers("/api/v1/orders/my-orders", "/api/v1/orders/code/**", "/api/v1/orders/*/cancel")
                        .authenticated()
                        .requestMatchers("/api/v1/orders/*/status", "/api/v1/orders/*/export", "/api/v1/orders")
                        .hasAnyAuthority("ADMIN", "STAFF")
                        .requestMatchers("/api/v1/users/profile", "/api/v1/users/profile/**",
                                "/api/v1/users/change-password")
                        .authenticated()
                        .requestMatchers("/api/v1/users/code/**").hasAnyAuthority("ADMIN", "STAFF")
                        .requestMatchers("/api/v1/users/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/v1/inventory/**").hasAnyAuthority("ADMIN", "STAFF")
                        .anyRequest().authenticated())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));

        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
