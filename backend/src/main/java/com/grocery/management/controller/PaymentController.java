package com.grocery.management.controller;

import com.grocery.management.config.VNPayConfig;
import com.grocery.management.entity.Order;
import com.grocery.management.repository.OrderRepository;
import com.grocery.management.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.UnsupportedEncodingException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final VNPayService vnPayService;
    private final OrderRepository orderRepository;

    @GetMapping("/create_payment/{orderId}")
    public ResponseEntity<?> createPayment(HttpServletRequest request, @PathVariable Long orderId) {
        try {
            Optional<Order> orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy đơn hàng");
            }

            Order order = orderOpt.get();
            long amount = order.getFinalAmount().longValue(); // VNPay yêu cầu số nguyên (không có phần thập phân)
            String ipAddress = VNPayConfig.getIpAddress(request);
            
            // Sử dụng mã hóa đơn hoặc ID làm mã tham chiếu. Dùng mã Hóa đơn.
            String orderCode = order.getCode();

            String paymentUrl = vnPayService.createPaymentUrl(orderCode, amount, ipAddress);

            Map<String, String> response = new HashMap<>();
            response.put("paymentUrl", paymentUrl);
            return ResponseEntity.ok(response);

        } catch (UnsupportedEncodingException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi tạo url thanh toán: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi không xác định: " + e.getMessage());
        }
    }

    @GetMapping("/vnpay_return")
    public ResponseEntity<?> vnpayReturn(HttpServletRequest request) {
        Map<String, String> fields = new HashMap<>();
        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements(); ) {
            String fieldName = params.nextElement();
            String fieldValue = request.getParameter(fieldName);
            if (fieldValue != null && fieldValue.length() > 0) {
                fields.put(fieldName, fieldValue);
            }
        }

        String vnp_SecureHash = request.getParameter("vnp_SecureHash");
        boolean isSignatureValid = vnPayService.validatePaymentReturn(fields);

        if (!isSignatureValid) {
            // Chữ ký không hợp lệ
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("status", "error", "message", "Chữ ký không hợp lệ"));
        }

        String orderCode = request.getParameter("vnp_TxnRef");
        String vnp_ResponseCode = request.getParameter("vnp_ResponseCode");

        Optional<Order> orderOpt = orderRepository.findByCode(orderCode);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "error", "message", "Không tìm thấy đơn hàng"));
        }

        Order order = orderOpt.get();

        if ("00".equals(vnp_ResponseCode)) {
            // Thanh toán thành công
            if ("PENDING".equals(order.getStatus())) {
                order.setStatus("COMPLETED");
                orderRepository.save(order);
            }
            return ResponseEntity.ok(Map.of("status", "success", "message", "Thanh toán thành công"));
        } else {
            // Thanh toán thất bại hoặc hủy xác nhận
            if ("PENDING".equals(order.getStatus())) {
                order.setStatus("CANCELLED");
                orderRepository.save(order);
            }
            return ResponseEntity.ok(Map.of("status", "failed", "message", "Thanh toán thất bại"));
        }
    }
}
