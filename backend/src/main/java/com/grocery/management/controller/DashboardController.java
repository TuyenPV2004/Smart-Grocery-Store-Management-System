package com.grocery.management.controller;

import com.grocery.management.dto.DashboardDTO;
import com.grocery.management.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardDTO> getDashboardStats(@RequestParam(defaultValue = "7") Integer days) {
        return ResponseEntity.ok(dashboardService.getDashboardStats(days));
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<DashboardDTO.TopProduct>> getTopProducts(
            @RequestParam(defaultValue = "7") Integer days,
            @RequestParam(defaultValue = "5") Integer limit) {
        return ResponseEntity.ok(dashboardService.getTopProducts(days, limit));
    }

    @GetMapping("/category-sales")
    public ResponseEntity<List<DashboardDTO.CategorySales>> getCategorySales(
            @RequestParam(defaultValue = "7") Integer days) {
        return ResponseEntity.ok(dashboardService.getCategorySales(days));
    }
}
