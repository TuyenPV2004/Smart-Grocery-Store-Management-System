package com.grocery.management.controller;

import com.grocery.management.dto.AuthenticatedUserProfile;
import com.grocery.management.dto.OrderRequest;
import com.grocery.management.entity.Order;
import com.grocery.management.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayInputStream;
import java.io.IOException;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody OrderRequest request, Authentication authentication) {
        try {
            AuthenticatedUserProfile currentUser = (AuthenticatedUserProfile) authentication.getPrincipal();
            return ResponseEntity.ok(orderService.createOrder(request, currentUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders(Authentication authentication) {
        AuthenticatedUserProfile currentUser = (AuthenticatedUserProfile) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getOrdersForUser(currentUser));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<?> getOrderByCode(@PathVariable String code, Authentication authentication) {
        try {
            return ResponseEntity.ok(orderService.getOrderByCodeForUser(code, authentication));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long id, Authentication authentication) {
        try {
            return ResponseEntity.ok(orderService.cancelOrder(id, authentication));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<InputStreamResource> exportOrderExcel(@PathVariable Long id) throws IOException {
        Order order = orderService.getOrderById(id);
        ByteArrayInputStream in = orderService.exportToExcel(id);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=" + order.getCode() + ".xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }
}
