package com.grocery.management.service;

import com.grocery.management.dto.OrderRequest;
import com.grocery.management.entity.*;
import com.grocery.management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;
    private final UserRepository userRepository;
    private final VoucherService voucherService;

    @Transactional
    public Order createOrder(OrderRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Order order = new Order();
        // Sinh mã hóa đơn: ORD + YYMMDD + Random/Time
        String orderCode = "ORD" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmmss"));
        order.setCode(orderCode);
        order.setCreatedAt(LocalDateTime.now());
        order.setUser(user);
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setStatus("COMPLETED");

        List<OrderDetail> details = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderRequest.OrderItem item : request.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại: " + item.getProductId()));

            // 1. Kiểm tra tồn kho tổng
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new RuntimeException(
                        "Sản phẩm '" + product.getName() + "' không đủ hàng. Tồn: " + product.getStockQuantity());
            }

            // 2. LOGIC FEFO TỰ ĐỘNG (Trừ kho Batch)
            int quantityToDeduct = item.getQuantity();
            List<ProductBatch> batches = productBatchRepository
                    .findByProductIdAndQuantityGreaterThanOrderByExpiryDateAsc(product.getId(), 0);

            for (ProductBatch batch : batches) {
                if (quantityToDeduct <= 0)
                    break;

                int taken = Math.min(batch.getQuantity(), quantityToDeduct);
                batch.setQuantity(batch.getQuantity() - taken);
                productBatchRepository.save(batch);

                quantityToDeduct -= taken;
            }

            if (quantityToDeduct > 0) {
                throw new RuntimeException("Lỗi dữ liệu kho: Tổng tồn kho và chi tiết lô không khớp.");
            }

            // 3. Trừ kho tổng Product
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            productRepository.save(product);

            // 4. Tạo chi tiết
            OrderDetail detail = new OrderDetail();
            detail.setOrder(order);
            detail.setProduct(product);
            detail.setQuantity(item.getQuantity());
            detail.setPrice(item.getPrice());
            detail.setTotalLine(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));

            details.add(detail);
            totalAmount = totalAmount.add(detail.getTotalLine());
        }

        order.setDetails(details);
        order.setTotalAmount(totalAmount);

        BigDecimal discount = BigDecimal.ZERO;
        if (request.getVoucherCode() != null && !request.getVoucherCode().trim().isEmpty()) {
            Voucher voucher = voucherService.validateVoucher(request.getVoucherCode());
            if (voucher.getMinOrderValue() != null && totalAmount.compareTo(voucher.getMinOrderValue()) < 0) {
                throw new RuntimeException(
                        "Đơn hàng chưa đạt giá trị tối thiểu để dùng voucher này: " + voucher.getMinOrderValue());
            }

            if ("PERCENTAGE".equals(voucher.getDiscountType())) {
                discount = totalAmount.multiply(voucher.getDiscountValue()).divide(BigDecimal.valueOf(100));
                if (voucher.getMaxDiscountAmount() != null && discount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                    discount = voucher.getMaxDiscountAmount();
                }
            } else {
                discount = voucher.getDiscountValue();
            }

            // if discount is greater than total, cap it
            if (discount.compareTo(totalAmount) > 0)
                discount = totalAmount;

            voucherService.incrementUsage(voucher.getId());
            order.setVoucherCode(voucher.getCode());
        }

        order.setDiscount(discount);
        order.setFinalAmount(totalAmount.subtract(discount));

        return orderRepository.save(order);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll(org.springframework.data.domain.Sort
                .by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
    }
}