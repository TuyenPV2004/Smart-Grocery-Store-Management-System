package com.grocery.management.controller;

import com.grocery.management.dto.DashboardDTO;
import com.grocery.management.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardDTO> getDashboardStats(@RequestParam(defaultValue = "7") Integer days) {
        return ResponseEntity.ok(dashboardService.getDashboardStats(days));
    }
}
