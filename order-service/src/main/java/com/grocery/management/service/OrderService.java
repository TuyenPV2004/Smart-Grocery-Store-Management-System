package com.grocery.management.service;

import com.grocery.management.dto.AuthenticatedUserProfile;
import com.grocery.management.dto.OrderCreatedEvent;
import com.grocery.management.dto.OrderRequest;
import com.grocery.management.dto.ProductSnapshotResponse;
import com.grocery.management.entity.Order;
import com.grocery.management.entity.OrderDetail;
import com.grocery.management.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CatalogClient catalogClient;
    private final OrderEventPublisher orderEventPublisher;

    @Transactional
    public Order createOrder(OrderRequest request, AuthenticatedUserProfile currentUser) {
        LocalDateTime now = LocalDateTime.now();

        Order order = new Order();
        order.setCode("ORD" + now.format(DateTimeFormatter.ofPattern("yyMMddHHmmss")));
        order.setCreatedAt(now);
        order.setUserId(currentUser.getId());
        order.setUsername(currentUser.getUsername());
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setPaymentMethod("CHUYEN_KHOAN");
        order.setInventoryAllocated(false);
        order.setVoucherUsageCommitted(false);
        order.setStatus("PENDING");
        order.setPaymentStatus("PENDING");
        order.setPaymentExpiresAt(now.plusMinutes(15));

        List<OrderDetail> details = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (OrderRequest.OrderItem item : request.getItems()) {
            ProductSnapshotResponse product = catalogClient.getProductSnapshot(item.getProductId());
            BigDecimal unitPrice = product.getSellPrice() != null ? product.getSellPrice() : item.getPrice();
            if (unitPrice == null) {
                throw new RuntimeException("Khong xac dinh duoc gia san pham: " + item.getProductId());
            }

            OrderDetail detail = new OrderDetail();
            detail.setOrder(order);
            detail.setProductId(product.getId());
            detail.setProductSku(product.getSku());
            detail.setProductName(product.getName());
            detail.setProductUnit(product.getUnit());
            detail.setProductThumbnail(product.getThumbnail());
            detail.setProductStatus(product.getStatus());
            detail.setQuantity(item.getQuantity());
            detail.setPrice(unitPrice);
            detail.setTotalLine(unitPrice.multiply(BigDecimal.valueOf(item.getQuantity())));
            details.add(detail);
            totalAmount = totalAmount.add(detail.getTotalLine());
        }

        order.setDetails(details);
        order.setTotalAmount(totalAmount);
        BigDecimal discount = request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO;
        if (discount.compareTo(totalAmount) > 0) {
            discount = totalAmount;
        }
        order.setDiscount(discount);
        order.setVoucherCode(request.getVoucherCode());
        order.setFinalAmount(totalAmount.subtract(discount));

        Order savedOrder = orderRepository.save(order);
        orderEventPublisher.publishOrderCreated(new OrderCreatedEvent(
                savedOrder.getId(),
                savedOrder.getCode(),
                currentUser.getId(),
                currentUser.getUsername(),
                savedOrder.getCustomerName(),
                savedOrder.getCustomerPhone(),
                currentUser.getEmail(),
                savedOrder.getFinalAmount(),
                savedOrder.getPaymentMethod(),
                savedOrder.getVoucherCode(),
                savedOrder.getCreatedAt()));
        return savedOrder;
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay don hang"));
    }

    @Transactional(readOnly = true)
    public Order getOrderByCode(String code) {
        return orderRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Khong tim thay don hang"));
    }

    @Transactional(readOnly = true)
    public Order getOrderByCodeForUser(String code, Authentication authentication) {
        if (hasAnyRole(authentication, "ADMIN", "STAFF")) {
            return getOrderByCode(code);
        }
        AuthenticatedUserProfile currentUser = getCurrentUser(authentication);
        return orderRepository.findByCodeForUser(code, currentUser.getUsername(), currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Ban khong co quyen xem don hang nay"));
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByUsername(String username) {
        return orderRepository.findByUsernameOrderByCreatedAtDesc(username);
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersForUser(AuthenticatedUserProfile currentUser) {
        return orderRepository.findForUser(currentUser.getUsername(), currentUser.getId());
    }

    @Transactional
    public Order cancelOrder(Long orderId, Authentication authentication) {
        AuthenticatedUserProfile currentUser = getCurrentUser(authentication);
        Order order = hasAnyRole(authentication, "ADMIN", "STAFF")
                ? getOrderById(orderId)
                : orderRepository.findByIdForUser(orderId, currentUser.getUsername(), currentUser.getId())
                        .orElseThrow(() -> new RuntimeException("Ban khong co quyen thao tac don hang nay"));

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new RuntimeException("Chi co the huy don hang o trang thai cho xac nhan");
        }

        order.setStatus("CANCELLED");
        order.setPaymentStatus("CANCELLED");
        order.setPaymentFailureReason("Don hang da bi huy");
        order.setPaymentExpiresAt(null);
        return orderRepository.save(order);
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, String newStatus) {
        Order order = getOrderById(orderId);
        String normalizedStatus = newStatus == null ? "" : newStatus.toUpperCase();
        if (!"COMPLETED".equals(normalizedStatus) && !"CANCELLED".equals(normalizedStatus)) {
            throw new RuntimeException("Trang thai khong hop le");
        }
        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new RuntimeException("Chi co the cap nhat don hang dang cho xu ly");
        }
        if ("COMPLETED".equals(normalizedStatus)) {
            order.setStatus("COMPLETED");
            order.setPaymentStatus("PAID");
            order.setPaymentConfirmedAt(LocalDateTime.now());
            order.setPaymentExpiresAt(null);
        } else {
            order.setStatus("CANCELLED");
            order.setPaymentStatus("CANCELLED");
            order.setPaymentFailureReason("Don hang da bi huy");
            order.setPaymentExpiresAt(null);
        }
        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public Order getOrderForPayment(Long orderId, Authentication authentication) {
        AuthenticatedUserProfile currentUser = getCurrentUser(authentication);
        Order order = hasAnyRole(authentication, "ADMIN", "STAFF")
                ? getOrderById(orderId)
                : orderRepository.findByIdForUser(orderId, currentUser.getUsername(), currentUser.getId())
                        .orElseThrow(() -> new RuntimeException("Ban khong co quyen thanh toan don hang nay"));

        if (!"PENDING".equalsIgnoreCase(order.getStatus()) || !"PENDING".equalsIgnoreCase(order.getPaymentStatus())) {
            throw new RuntimeException("Don hang khong con o trang thai cho thanh toan");
        }
        if (order.getPaymentExpiresAt() != null && order.getPaymentExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Don hang da het han thanh toan");
        }
        return order;
    }

    @Transactional
    public Order markOrderPaid(String orderCode, String transactionNo, LocalDateTime paidAt) {
        Order order = getOrderByCode(orderCode);
        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            return order;
        }
        order.setStatus("COMPLETED");
        order.setPaymentStatus("PAID");
        order.setPaymentFailureReason(null);
        order.setPaymentTransactionNo(transactionNo);
        order.setPaymentConfirmedAt(paidAt != null ? paidAt : LocalDateTime.now());
        order.setPaymentExpiresAt(null);
        return orderRepository.save(order);
    }

    @Transactional
    public Order markOrderPaymentFailed(String orderCode, String failureReason, String paymentStatus) {
        Order order = getOrderByCode(orderCode);
        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            return order;
        }
        order.setStatus("CANCELLED");
        order.setPaymentStatus(paymentStatus);
        order.setPaymentFailureReason(failureReason);
        order.setPaymentExpiresAt(null);
        return orderRepository.save(order);
    }

    @Transactional
    public int expirePendingPayments() {
        List<Order> expiredOrders = orderRepository.findByPaymentStatusAndPaymentExpiresAtBefore("PENDING", LocalDateTime.now());
        int updated = 0;
        for (Order order : expiredOrders) {
            if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
                continue;
            }
            order.setStatus("CANCELLED");
            order.setPaymentStatus("EXPIRED");
            order.setPaymentFailureReason("Qua han thanh toan");
            order.setPaymentExpiresAt(null);
            orderRepository.save(order);
            updated++;
        }
        return updated;
    }

    @Transactional(readOnly = true)
    public ByteArrayInputStream exportToExcel(Long orderId) throws IOException {
        Order order = getOrderById(orderId);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(order.getCode());

            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.GREEN.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
            sheet.createRow(0).createCell(0).setCellValue("MA DON HANG: " + safeString(order.getCode()));
            sheet.createRow(1).createCell(0).setCellValue("THOI GIAN TAO: " + formatDate(order.getCreatedAt(), formatter));
            sheet.createRow(2).createCell(0).setCellValue("KHACH HANG: " + safeString(order.getCustomerName()));
            sheet.createRow(3).createCell(0).setCellValue("SO DIEN THOAI: " + safeString(order.getCustomerPhone()));
            sheet.createRow(4).createCell(0).setCellValue("THANH TOAN: " + safeString(order.getPaymentMethod()));
            sheet.createRow(5).createCell(0).setCellValue("TRANG THAI: " + safeString(order.getStatus()));

            String[] columns = {"STT", "Ten san pham", "Ma SKU", "So luong", "Don gia", "Thanh tien"};
            Row headerRow = sheet.createRow(7);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            int rowIdx = 8;
            int stt = 1;
            for (OrderDetail detail : order.getDetails()) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(stt++);
                row.createCell(1).setCellValue(safeString(detail.getProductName()));
                row.createCell(2).setCellValue(safeString(detail.getProductSku()));
                row.createCell(3).setCellValue(detail.getQuantity());
                row.createCell(4).setCellValue(toDouble(detail.getPrice()));
                row.createCell(5).setCellValue(toDouble(detail.getTotalLine()));
            }

            Row totalRow = sheet.createRow(rowIdx + 1);
            totalRow.createCell(4).setCellValue("Tong tien:");
            totalRow.createCell(5).setCellValue(toDouble(order.getTotalAmount()));

            Row discountRow = sheet.createRow(rowIdx + 2);
            discountRow.createCell(4).setCellValue("Giam gia:");
            discountRow.createCell(5).setCellValue(toDouble(order.getDiscount()));

            Row finalRow = sheet.createRow(rowIdx + 3);
            finalRow.createCell(4).setCellValue("Thanh toan:");
            finalRow.createCell(5).setCellValue(toDouble(order.getFinalAmount()));

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    private boolean hasAnyRole(Authentication authentication, String... roles) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }
        for (String role : roles) {
            boolean matched = authentication.getAuthorities().stream()
                    .anyMatch(authority -> role.equalsIgnoreCase(authority.getAuthority()));
            if (matched) {
                return true;
            }
        }
        return false;
    }

    private AuthenticatedUserProfile getCurrentUser(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUserProfile currentUser) {
            return currentUser;
        }
        AuthenticatedUserProfile fallback = new AuthenticatedUserProfile();
        fallback.setUsername(authentication != null ? authentication.getName() : null);
        return fallback;
    }

    private String safeString(String value) {
        return value != null ? value : "";
    }

    private String formatDate(LocalDateTime value, DateTimeFormatter formatter) {
        return value != null ? value.format(formatter) : "";
    }

    private double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : 0d;
    }
}
