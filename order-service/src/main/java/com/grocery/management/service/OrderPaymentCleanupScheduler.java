package com.grocery.management.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OrderPaymentCleanupScheduler {

    private final OrderService orderService;

    @Scheduled(fixedDelay = 60000)
    public void expirePendingPayments() {
        orderService.expirePendingPayments();
    }
}
