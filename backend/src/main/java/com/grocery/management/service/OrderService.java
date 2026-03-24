package com.grocery.management.service;

import com.grocery.management.dto.OrderRequest;
import com.grocery.management.entity.*;
import com.grocery.management.repository.*;
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
        if (Boolean.TRUE.equals(request.getPendingConfirmation())) {
            order.setStatus("PENDING");
        } else {
            String paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod().toUpperCase() : "";
            // Don chuyen khoan can duoc xac nhan xu ly; tien mat tai quay co the hoan tat
            // ngay.
            if ("CHUYEN_KHOAN".equals(paymentMethod) || "TRANSFER".equals(paymentMethod)) {
                order.setStatus("PENDING");
            } else {
                order.setStatus("COMPLETED");
            }
        }

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

    @Transactional(readOnly = true)
    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng"));
    }

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

            sheet.createRow(0).createCell(0)
                    .setCellValue("M\u00c3 \u0110\u01a0N H\u00c0NG: " + safeString(order.getCode()));
            sheet.createRow(1).createCell(0)
                    .setCellValue("TH\u1edcI GIAN T\u1ea0O: "
                            + (order.getCreatedAt() != null ? order.getCreatedAt().format(formatter) : ""));
            sheet.createRow(2).createCell(0)
                    .setCellValue("TH\u1edcI GIAN XU\u1ea4T: "
                            + LocalDateTime.now().format(formatter));
            sheet.createRow(3).createCell(0)
                    .setCellValue("KH\u00c1CH H\u00c0NG: " + safeString(order.getCustomerName()));
            sheet.createRow(4).createCell(0)
                    .setCellValue("S\u1ed0 \u0110I\u1ec6N THO\u1ea0I: " + safeString(order.getCustomerPhone()));
            sheet.createRow(5).createCell(0).setCellValue(
                    "NH\u00c2N VI\u00caN: " + (order.getUser() != null ? safeString(order.getUser().getFullName()) : ""));
            sheet.createRow(6).createCell(0)
                    .setCellValue("THANH TO\u00c1N: " + safeString(getPaymentMethodLabelVi(order.getPaymentMethod())));
            sheet.createRow(7).createCell(0)
                    .setCellValue("TR\u1ea0NG TH\u00c1I: " + safeString(getStatusLabelVi(order.getStatus())));

            String[] columns = {
                    "STT",
                    "T\u00ean s\u1ea3n ph\u1ea9m",
                    "M\u00e3 SKU",
                    "S\u1ed1 l\u01b0\u1ee3ng",
                    "\u0110\u01a1n gi\u00e1",
                    "Th\u00e0nh ti\u1ec1n"
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
            totalRow.createCell(4).setCellValue("T\u1ed5ng ti\u1ec1n:");
            totalRow.createCell(5).setCellValue(toDouble(order.getTotalAmount()));

            Row discountRow = sheet.createRow(rowIdx + 2);
            discountRow.createCell(4).setCellValue("Gi\u1ea3m gi\u00e1:");
            discountRow.createCell(5).setCellValue(toDouble(order.getDiscount()));

            Row finalRow = sheet.createRow(rowIdx + 3);
            finalRow.createCell(4).setCellValue("Thanh to\u00e1n:");
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
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

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

        order.setStatus("CANCELLED");
        return orderRepository.save(order);
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, String username, String newStatus) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Order order;
        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.STAFF) {
            order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        } else {
            order = orderRepository.findByIdAndUserUsername(orderId, username)
                    .orElseThrow(() -> new RuntimeException("Bạn không có quyền thao tác đơn hàng này"));
        }

        String normalizedStatus = newStatus == null ? "" : newStatus.toUpperCase();
        if (!"COMPLETED".equals(normalizedStatus) && !"CANCELLED".equals(normalizedStatus)) {
            throw new RuntimeException("Trạng thái không hợp lệ");
        }

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new RuntimeException("Chỉ có thể cập nhật đơn hàng đang chờ thanh toán");
        }

        order.setStatus(normalizedStatus);
        return orderRepository.save(order);
    }
    private double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : 0d;
    }

    private String safeString(String value) {
        return value != null ? value : "";
    }

    private String getPaymentMethodLabel(String method) {
        if (method == null) {
            return "";
        }

        return switch (method.toUpperCase()) {
            case "CASH" -> "Tiá»n máº·t";
            case "TRANSFER", "CHUYEN_KHOAN" -> "Chuyá»ƒn khoáº£n";
            default -> method;
        };
    }

    private String getStatusLabel(String status) {
        if (status == null) {
            return "";
        }

        return switch (status.toUpperCase()) {
            case "COMPLETED" -> "HoÃ n thÃ nh";
            case "CANCELLED" -> "ÄÃ£ há»§y";
            case "PENDING" -> "Chá» xÃ¡c nháº­n";
            case "SHIPPING" -> "Äang giao";
            default -> status;
        };
    }
    private String getPaymentMethodLabelVi(String method) {
        if (method == null) {
            return "";
        }

        return switch (method.toUpperCase()) {
            case "CASH" -> "Ti\u1ec1n m\u1eb7t";
            case "TRANSFER", "CHUYEN_KHOAN" -> "Chuy\u1ec3n kho\u1ea3n";
            default -> method;
        };
    }

    private String getStatusLabelVi(String status) {
        if (status == null) {
            return "";
        }

        return switch (status.toUpperCase()) {
            case "COMPLETED" -> "Ho\u00e0n th\u00e0nh";
            case "CANCELLED" -> "\u0110\u00e3 h\u1ee7y";
            case "PENDING" -> "Ch\u1edd x\u00e1c nh\u1eadn";
            case "SHIPPING" -> "\u0110ang giao";
            default -> status;
        };
    }
}
