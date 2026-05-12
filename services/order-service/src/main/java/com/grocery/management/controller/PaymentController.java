package com.grocery.management.controller;

import com.grocery.management.config.VNPayConfig;
import com.grocery.management.entity.Order;
import com.grocery.management.service.OrderService;
import com.grocery.management.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.UnsupportedEncodingException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final VNPayService vnPayService;
    private final OrderService orderService;

    @GetMapping("/create_payment/{orderId}")
    public ResponseEntity<?> createPayment(HttpServletRequest request, @PathVariable Long orderId, Authentication authentication) {
        try {
            Order order = orderService.getOrderForPayment(orderId, authentication);
            String paymentUrl = vnPayService.createPaymentUrl(
                    order.getCode(),
                    order.getFinalAmount().longValue(),
                    VNPayConfig.getIpAddress(request),
                    order.getPaymentExpiresAt());

            Map<String, Object> response = new HashMap<>();
            response.put("paymentUrl", paymentUrl);
            response.put("orderCode", order.getCode());
            response.put("expiresAt", order.getPaymentExpiresAt());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (UnsupportedEncodingException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Loi tao url thanh toan: " + e.getMessage());
        }
    }

    @GetMapping("/vnpay_return")
    public ResponseEntity<?> vnpayReturn(HttpServletRequest request) {
        return processVnpayCallback(request, false);
    }

    @GetMapping("/vnpay_ipn")
    public ResponseEntity<?> vnpayIpn(HttpServletRequest request) {
        return processVnpayCallback(request, true);
    }

    private ResponseEntity<?> processVnpayCallback(HttpServletRequest request, boolean ipnCallback) {
        try {
            Map<String, String> fields = new HashMap<>();
            for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements();) {
                String fieldName = params.nextElement();
                String fieldValue = request.getParameter(fieldName);
                if (fieldValue != null && !fieldValue.isBlank()) {
                    fields.put(fieldName, fieldValue);
                }
            }

            boolean isSignatureValid = vnPayService.validatePaymentReturn(fields);
            if (!isSignatureValid) {
                if (ipnCallback) {
                    return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid signature"));
                }
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("status", "error", "message", "Chu ky khong hop le"));
            }

            String orderCode = request.getParameter("vnp_TxnRef");
            String responseCode = request.getParameter("vnp_ResponseCode");
            String transactionNo = request.getParameter("vnp_TransactionNo");
            LocalDateTime paidAt = parseVnpayDate(request.getParameter("vnp_PayDate"));

            if (orderCode == null || orderCode.isBlank()) {
                if (ipnCallback) {
                    return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Order not found"));
                }
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("status", "error", "message", "Khong tim thay don hang"));
            }

            if ("00".equals(responseCode)) {
                Order order = orderService.markOrderPaid(orderCode, transactionNo, paidAt);
                if (ipnCallback) {
                    return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
                }
                return ResponseEntity.ok(buildFrontendResult("success", "Thanh toan don hang thanh cong", order));
            }

            Order order = orderService.markOrderPaymentFailed(orderCode, mapFailureMessage(responseCode), "FAILED");
            if (ipnCallback) {
                return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
            }
            return ResponseEntity.ok(buildFrontendResult("failed", mapFailureMessage(responseCode), order));
        } catch (RuntimeException e) {
            if (ipnCallback) {
                return ResponseEntity.ok(Map.of("RspCode", "99", "Message", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        } catch (Exception e) {
            if (ipnCallback) {
                return ResponseEntity.ok(Map.of("RspCode", "99", "Message", "Unknown error"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "message", "Loi he thong khi xu ly thanh toan"));
        }
    }

    private Map<String, Object> buildFrontendResult(String status, String message, Order order) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", status);
        response.put("message", message);
        response.put("orderId", order.getId());
        response.put("orderCode", order.getCode());
        response.put("orderStatus", order.getStatus());
        response.put("paymentStatus", order.getPaymentStatus());
        response.put("paymentTransactionNo", order.getPaymentTransactionNo());
        response.put("paymentConfirmedAt", order.getPaymentConfirmedAt());
        response.put("paymentExpiresAt", order.getPaymentExpiresAt());
        response.put("finalAmount", order.getFinalAmount());
        return response;
    }

    private String mapFailureMessage(String responseCode) {
        if (responseCode == null || responseCode.isBlank()) {
            return "Thanh toan that bai";
        }
        return switch (responseCode) {
            case "24" -> "Giao dich da bi huy";
            case "51" -> "Tai khoan khong du so du";
            case "65" -> "Tai khoan vuot qua han muc giao dich";
            case "75" -> "Ngan hang thanh toan dang bao tri";
            default -> "Thanh toan that bai";
        };
    }

    private LocalDateTime parseVnpayDate(String payDate) {
        if (payDate == null || payDate.isBlank()) {
            return LocalDateTime.now();
        }
        try {
            return LocalDateTime.parse(payDate, DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        } catch (DateTimeParseException ex) {
            return LocalDateTime.now();
        }
    }
}
