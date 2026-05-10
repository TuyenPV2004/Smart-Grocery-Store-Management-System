package com.grocery.management.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.disable())
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/api/auth/**", "/product-images/**", "/user-photos/**").permitAll()
                        .requestMatchers("/user-photos/**").permitAll()
                        .requestMatchers("/product-images/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/products/*").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers("/api/payment/vnpay_return", "/api/payment/vnpay_ipn").permitAll()
                        .requestMatchers("/api/vouchers/validate", "/api/vouchers/*/commit-usage").permitAll()
                        .requestMatchers("/api/chat/socket-ticket").permitAll()
                        .requestMatchers("/api/chat/conversations/**", "/api/chat/conversations")
                        .hasAnyAuthority("ADMIN", "STAFF")
                        .requestMatchers("/api/chat/**").authenticated()
                        .requestMatchers("/api/payment/create_payment/**").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/orders").authenticated()
                        .requestMatchers("/api/orders/my-orders", "/api/orders/code/**", "/api/orders/*/cancel")
                        .authenticated()
                        .requestMatchers("/api/orders/*/status", "/api/orders/*/export", "/api/orders")
                        .hasAnyAuthority("ADMIN", "STAFF")
                        .requestMatchers("/api/dashboard/**").hasAnyAuthority("ADMIN", "STAFF")
                        .requestMatchers("/api/users/profile", "/api/users/profile/**",
                                "/api/users/change-password")
                        .authenticated()
                        .requestMatchers("/api/users/code/**").hasAnyAuthority("ADMIN", "STAFF")
                        .requestMatchers("/api/users/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/inventory/**").hasAnyAuthority("ADMIN", "STAFF")
                        .anyRequest().authenticated())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
