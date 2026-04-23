package com.grocery.management.service;

import com.grocery.management.dto.OrderRequest;
import com.grocery.management.entity.Order;
import com.grocery.management.entity.OrderDetail;
import com.grocery.management.entity.Product;
import com.grocery.management.entity.ProductBatch;
import com.grocery.management.entity.Role;
import com.grocery.management.entity.User;
import com.grocery.management.entity.Voucher;
import com.grocery.management.repository.OrderRepository;
import com.grocery.management.repository.ProductBatchRepository;
import com.grocery.management.repository.ProductRepository;
import com.grocery.management.repository.UserRepository;
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
    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;
    private final UserRepository userRepository;
    private final VoucherService voucherService;

    @Transactional
    public Order createOrder(OrderRequest request, String username) {
        User user = getUserByUsername(username);
        LocalDateTime now = LocalDateTime.now();

        Order order = new Order();
        order.setCode("ORD" + now.format(DateTimeFormatter.ofPattern("yyMMddHHmmss")));
        order.setCreatedAt(now);
        order.setUser(user);
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setPaymentMethod("CHUYEN_KHOAN");
        order.setInventoryAllocated(false);
        order.setVoucherUsageCommitted(false);
        order.setPaymentTransactionNo(null);
        order.setPaymentFailureReason(null);
        order.setPaymentConfirmedAt(null);
        order.setStatus("PENDING");
        order.setPaymentStatus("PENDING");
        order.setPaymentExpiresAt(now.plusMinutes(15));

        List<OrderDetail> details = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderRequest.OrderItem item : request.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại: " + item.getProductId()));

            if (product.getStockQuantity() < item.getQuantity()) {
                throw new RuntimeException(
                        "Sản phẩm '" + product.getName() + "' không đủ hàng. Tồn: " + product.getStockQuantity());
            }

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

            if (discount.compareTo(totalAmount) > 0) {
                discount = totalAmount;
            }

            order.setVoucherCode(voucher.getCode());
        }

        order.setDiscount(discount);
        order.setFinalAmount(totalAmount.subtract(discount));

        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        return orderRepository.findAll(org.springframework.data.domain.Sort
                .by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
    }

    @Transactional(readOnly = true)
    public Order getOrderByCode(String code) {
        return orderRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
    }

    @Transactional(readOnly = true)
    public Order getOrderByCodeForUser(String code, String username) {
        User currentUser = getUserByUsername(username);
        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.STAFF) {
            return getOrderByCode(code);
        }

        return orderRepository.findByCodeAndUserUsername(code, username)
                .orElseThrow(() -> new RuntimeException("Bạn không có quyền xem đơn hàng này"));
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByUsername(String username) {
        return orderRepository.findByUserUsernameOrderByCreatedAtDesc(username);
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

            sheet.createRow(0).createCell(0).setCellValue("MÃ ĐƠN HÀNG: " + safeString(order.getCode()));
            sheet.createRow(1).createCell(0).setCellValue(
                    "THỜI GIAN TẠO: " + (order.getCreatedAt() != null ? order.getCreatedAt().format(formatter) : ""));
            sheet.createRow(2).createCell(0)
                    .setCellValue("THỜI GIAN XUẤT: " + LocalDateTime.now().format(formatter));
            sheet.createRow(3).createCell(0).setCellValue("KHÁCH HÀNG: " + safeString(order.getCustomerName()));
            sheet.createRow(4).createCell(0)
                    .setCellValue("SỐ ĐIỆN THOẠI: " + safeString(order.getCustomerPhone()));
            sheet.createRow(5).createCell(0).setCellValue(
                    "NHÂN VIÊN: " + (order.getUser() != null ? safeString(order.getUser().getFullName()) : ""));
            sheet.createRow(6).createCell(0)
                    .setCellValue("THANH TOÁN: " + safeString(getPaymentMethodLabelVi(order.getPaymentMethod())));
            sheet.createRow(7).createCell(0)
                    .setCellValue("TRẠNG THÁI: " + safeString(getStatusLabelVi(order.getStatus())));

            String[] columns = {
                    "STT",
                    "Tên sản phẩm",
                    "Mã SKU",
                    "Số lượng",
                    "Đơn giá",
                    "Thành tiền"
            };

            Row headerRow = sheet.createRow(9);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            int rowIdx = 10;
            int stt = 1;
            if (order.getDetails() != null) {
                for (OrderDetail detail : order.getDetails()) {
                    Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(stt++);
                    row.createCell(1).setCellValue(
                            detail.getProduct() != null ? safeString(detail.getProduct().getName()) : "");
                    row.createCell(2).setCellValue(
                            detail.getProduct() != null ? safeString(detail.getProduct().getSku()) : "");
                    row.createCell(3).setCellValue(detail.getQuantity());
                    row.createCell(4).setCellValue(toDouble(detail.getPrice()));
                    row.createCell(5).setCellValue(toDouble(detail.getTotalLine()));
                }
            }

            Row totalRow = sheet.createRow(rowIdx + 1);
            totalRow.createCell(4).setCellValue("Tổng tiền:");
            totalRow.createCell(5).setCellValue(toDouble(order.getTotalAmount()));

            Row discountRow = sheet.createRow(rowIdx + 2);
            discountRow.createCell(4).setCellValue("Giảm giá:");
            discountRow.createCell(5).setCellValue(toDouble(order.getDiscount()));

            Row finalRow = sheet.createRow(rowIdx + 3);
            finalRow.createCell(4).setCellValue("Thanh toán:");
            finalRow.createCell(5).setCellValue(toDouble(order.getFinalAmount()));

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    @Transactional
    public Order cancelOrder(Long orderId, String username) {
        User currentUser = getUserByUsername(username);

        Order order;
        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.STAFF) {
            order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        } else {
            order = orderRepository.findByIdAndUserUsername(orderId, username)
                    .orElseThrow(() -> new RuntimeException("Bạn không có quyền thao tác đơn hàng này"));
        }

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new RuntimeException("Chỉ có thể hủy đơn hàng ở trạng thái chờ xác nhận");
        }

        return markPendingOrderAsCancelled(order, "Đơn hàng đã bị hủy");
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, String username, String newStatus) {
        User currentUser = getUserByUsername(username);
        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.STAFF) {
            throw new RuntimeException("Bạn không có quyền cập nhật trạng thái đơn hàng");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        String normalizedStatus = newStatus == null ? "" : newStatus.toUpperCase();
        if (!"COMPLETED".equals(normalizedStatus) && !"CANCELLED".equals(normalizedStatus)) {
            throw new RuntimeException("Trạng thái không hợp lệ");
        }

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new RuntimeException("Chỉ có thể cập nhật đơn hàng đang chờ xử lý");
        }

        if ("COMPLETED".equals(normalizedStatus)) {
            return completePendingOrder(order, null, LocalDateTime.now());
        }

        return markPendingOrderAsCancelled(order, "Đơn hàng đã bị hủy");
    }

    @Transactional(readOnly = true)
    public Order getOrderForPayment(Long orderId, String username) {
        User currentUser = getUserByUsername(username);
        Order order;

        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.STAFF) {
            order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        } else {
            order = orderRepository.findByIdAndUserUsername(orderId, username)
                    .orElseThrow(() -> new RuntimeException("Bạn không có quyền thanh toán đơn hàng này"));
        }

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new RuntimeException("Đơn hàng không còn ở trạng thái chờ thanh toán");
        }

        if (!"PENDING".equalsIgnoreCase(order.getPaymentStatus())) {
            throw new RuntimeException("Đơn hàng không còn ở trạng thái chờ thanh toán");
        }

        if (order.getPaymentExpiresAt() != null && order.getPaymentExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Đơn hàng đã hết hạn thanh toán");
        }

        return order;
    }

    @Transactional
    public Order markOrderPaid(String orderCode, String transactionNo, LocalDateTime paidAt) {
        Order order = getOrderByCode(orderCode);

        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            return order;
        }

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            return order;
        }

        return completePendingOrder(order, transactionNo, paidAt != null ? paidAt : LocalDateTime.now());
    }

    @Transactional
    public Order markOrderPaymentFailed(String orderCode, String failureReason, String paymentStatus) {
        Order order = getOrderByCode(orderCode);

        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            return order;
        }

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
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
        List<Order> expiredOrders = orderRepository.findByPaymentStatusAndPaymentExpiresAtBefore(
                "PENDING",
                LocalDateTime.now());

        int updatedCount = 0;
        for (Order order : expiredOrders) {
            if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
                continue;
            }

            order.setStatus("CANCELLED");
            order.setPaymentStatus("EXPIRED");
            order.setPaymentFailureReason("Quá hạn thanh toán");
            order.setPaymentExpiresAt(null);
            orderRepository.save(order);
            updatedCount++;
        }

        return updatedCount;
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }

    private void allocateInventory(Order order) {
        if (order.getDetails() == null) {
            return;
        }

        for (OrderDetail detail : order.getDetails()) {
            Product product = productRepository.findById(detail.getProduct().getId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại: " + detail.getProduct().getId()));

            if (product.getStockQuantity() < detail.getQuantity()) {
                throw new RuntimeException(
                        "Sản phẩm '" + product.getName() + "' không đủ hàng để hoàn tất thanh toán.");
            }

            int quantityToDeduct = detail.getQuantity();
            List<ProductBatch> batches = productBatchRepository
                    .findByProductIdAndQuantityGreaterThanOrderByExpiryDateAsc(product.getId(), 0);

            for (ProductBatch batch : batches) {
                if (quantityToDeduct <= 0) {
                    break;
                }

                int taken = Math.min(batch.getQuantity(), quantityToDeduct);
                batch.setQuantity(batch.getQuantity() - taken);
                productBatchRepository.save(batch);
                quantityToDeduct -= taken;
            }

            if (quantityToDeduct > 0) {
                throw new RuntimeException("Lỗi dữ liệu kho: tổng tồn kho và chi tiết lô không khớp.");
            }

            product.setStockQuantity(product.getStockQuantity() - detail.getQuantity());
            productRepository.save(product);
        }
    }

    private void commitVoucherUsageIfNeeded(Order order) {
        if (order.isVoucherUsageCommitted()) {
            return;
        }

        if (order.getVoucherCode() == null || order.getVoucherCode().isBlank()) {
            return;
        }

        Voucher voucher = voucherService.getVoucherByCode(order.getVoucherCode());
        voucherService.incrementUsage(voucher.getId());
        order.setVoucherUsageCommitted(true);
    }

    private Order completePendingOrder(Order order, String transactionNo, LocalDateTime paidAt) {
        if (!order.isInventoryAllocated()) {
            allocateInventory(order);
            order.setInventoryAllocated(true);
        }

        commitVoucherUsageIfNeeded(order);
        order.setStatus("COMPLETED");
        order.setPaymentStatus("PAID");
        order.setPaymentFailureReason(null);
        order.setPaymentTransactionNo(transactionNo);
        order.setPaymentConfirmedAt(paidAt);
        order.setPaymentExpiresAt(null);
        return orderRepository.save(order);
    }

    private Order markPendingOrderAsCancelled(Order order, String message) {
        order.setStatus("CANCELLED");
        order.setPaymentStatus("CANCELLED");
        order.setPaymentFailureReason(message);
        order.setPaymentExpiresAt(null);
        return orderRepository.save(order);
    }

    private double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : 0d;
    }

    private String safeString(String value) {
        return value != null ? value : "";
    }

    private String getPaymentMethodLabelVi(String method) {
        if (method == null) {
            return "";
        }

        return switch (method.toUpperCase()) {
            case "CHUYEN_KHOAN" -> "Chuyển khoản";
            default -> method;
        };
    }

    private String getStatusLabelVi(String status) {
        if (status == null) {
            return "";
        }

        return switch (status.toUpperCase()) {
            case "COMPLETED" -> "Hoàn thành";
            case "CANCELLED" -> "Đã hủy";
            case "PENDING" -> "Chờ xác nhận";
            case "SHIPPING" -> "Đang giao";
            default -> status;
        };
    }
}
