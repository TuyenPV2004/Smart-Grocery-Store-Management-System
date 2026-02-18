package com.grocery.management.service;

import com.grocery.management.dto.ProductRequest;
import com.grocery.management.entity.Product;
import com.grocery.management.entity.ProductStatus;
import com.grocery.management.entity.ProductHistory;
import com.grocery.management.entity.User;
import com.grocery.management.repository.ProductRepository;
import com.grocery.management.repository.ProductHistoryRepository;
import com.grocery.management.repository.SupplierRepository;
import com.grocery.management.repository.PriceHistoryRepository;
// SỬA: Thêm import Repository
import com.grocery.management.repository.InventoryNoteDetailRepository;
import com.grocery.management.repository.ProductBatchRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductHistoryRepository historyRepository;
    private final UserService userService;
    private final SupplierRepository supplierRepository;
    private final PriceHistoryRepository priceHistoryRepository;

    // SỬA: Inject thêm 2 repository này để kiểm tra ràng buộc
    private final InventoryNoteDetailRepository inventoryNoteDetailRepository;
    private final ProductBatchRepository productBatchRepository;

    /**
     * Tìm kiếm và lọc sản phẩm
     */
    public List<Product> getAllProducts(String keyword, ProductStatus status) {
        return productRepository.searchProducts(keyword, status);
    }

    /**
     * Lưu lịch sử thay đổi sản phẩm
     */
    private void saveHistory(Product product, String action) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userService.getUserByUsername(username);

            ProductHistory history = new ProductHistory();
            history.setProductId(product.getId());
            history.setProductName(product.getName());
            history.setSku(product.getSku());
            history.setAction(action);
            history.setPerformedBy(currentUser.getFullName());
            history.setRole(currentUser.getRole().name());
            history.setTimestamp(LocalDateTime.now());

            historyRepository.save(history);
        } catch (Exception e) {
            System.err.println("Không thể lưu lịch sử: " + e.getMessage());
        }
    }

    @Transactional
    public Product createProduct(Product product, MultipartFile imageFile) throws IOException {
        if (productRepository.existsBySku(product.getSku())) {
            throw new RuntimeException("Mã SKU đã tồn tại: " + product.getSku());
        }
        if (productRepository.existsByBarcode(product.getBarcode())) {
            throw new RuntimeException("Mã vạch đã tồn tại: " + product.getBarcode());
        }
        if (imageFile != null && !imageFile.isEmpty()) {
            String fileName = System.currentTimeMillis() + "_" + imageFile.getOriginalFilename();
            saveImageFile(fileName, imageFile);
            product.setThumbnail("product-images/" + fileName);
        }

        Product savedProduct = productRepository.save(product);
        saveHistory(savedProduct, "THÊM MỚI");

        // Save initial price history if import price is set
        if (savedProduct.getImportPrice() != null && savedProduct.getImportPrice().compareTo(BigDecimal.ZERO) > 0) {
            try {
                String username = SecurityContextHolder.getContext().getAuthentication().getName();
                User currentUser = userService.getUserByUsername(username);

                com.grocery.management.entity.PriceHistory priceHistory = new com.grocery.management.entity.PriceHistory();
                priceHistory.setProductId(savedProduct.getId());
                priceHistory.setOldPrice(BigDecimal.ZERO); // Initial price, old price is 0
                priceHistory.setNewPrice(savedProduct.getImportPrice());
                priceHistory.setChangedBy(currentUser.getFullName());
                priceHistory.setUserRole(currentUser.getRole().name());
                priceHistory.setChangedAt(LocalDateTime.now());

                priceHistoryRepository.save(priceHistory);
            } catch (Exception e) {
                System.err.println("Không thể lưu lịch sử giá ban đầu: " + e.getMessage());
            }
        }

        return savedProduct;
    }

    @Transactional
    public Product createQuickProduct(ProductRequest request, MultipartFile imageFile) throws IOException {
        Product product = new Product();
        product.setName(request.getName());
        product.setBarcode(request.getBarcode());
        if (request.getSupplierId() != null) {
            product.setSupplier(supplierRepository.findById(request.getSupplierId()).orElse(null));
        }
        String sku;
        if (request.getSku() != null && !request.getSku().isEmpty()) {
            sku = request.getSku();
            if (productRepository.existsBySku(sku)) {
                throw new RuntimeException("Mã SKU đã tồn tại: " + sku);
            }
        } else {
            do {
                int randomNum = (int) ((Math.random() * (999999 - 100000)) + 100000);
                sku = "SKU-" + randomNum;
            } while (productRepository.existsBySku(sku));
        }
        product.setSku(sku);
        product.setStockQuantity(0);
        product.setSellPrice(BigDecimal.ZERO);
        product.setUnit("Cái");
        product.setStatus(ProductStatus.ACTIVE);
        product.setImportPrice(request.getImportPrice() != null ? request.getImportPrice() : BigDecimal.ZERO);
        product.setShelfLife(request.getShelfLife() != null ? request.getShelfLife() : 0);
        if (imageFile != null && !imageFile.isEmpty()) {
            String fileName = System.currentTimeMillis() + "_" + imageFile.getOriginalFilename();
            saveImageFile(fileName, imageFile);
            product.setThumbnail("product-images/" + fileName);
        } else {
            product.setThumbnail("product-images/default.png");
        }

        Product savedProduct = productRepository.save(product);
        saveHistory(savedProduct, "Tạo nhanh");

        return savedProduct;
    }

    @Transactional
    public Product updateProduct(@NonNull Long id, Product input, MultipartFile imageFile) throws IOException {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        if (!existing.getSku().equals(input.getSku()) && productRepository.existsBySku(input.getSku())) {
            throw new RuntimeException("Mã SKU đã tồn tại");
        }
        if (!existing.getBarcode().equals(input.getBarcode())
                && productRepository.existsByBarcode(input.getBarcode())) {
            throw new RuntimeException("Mã vạch đã tồn tại");
        }

        existing.setName(input.getName());
        existing.setBrand(input.getBrand());
        existing.setDescription(input.getDescription());
        existing.setSku(input.getSku());
        existing.setBarcode(input.getBarcode());
        existing.setUnit(input.getUnit());
        existing.setImportPrice(input.getImportPrice());
        existing.setSellPrice(input.getSellPrice());
        existing.setStatus(input.getStatus());

        if (imageFile != null && !imageFile.isEmpty()) {
            String fileName = System.currentTimeMillis() + "_" + imageFile.getOriginalFilename();
            saveImageFile(fileName, imageFile);
            existing.setThumbnail("product-images/" + fileName);
        }

        Product updatedProduct = productRepository.save(existing);
        saveHistory(updatedProduct, "CẬP NHẬT");
        return updatedProduct;
    }

    private void saveImageFile(String fileName, MultipartFile file) throws IOException {
        Path uploadPath = Paths.get("product-images");
        if (!Files.exists(uploadPath))
            Files.createDirectories(uploadPath);
        try (InputStream inputStream = file.getInputStream()) {
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    @Transactional
    public String deleteProduct(@NonNull Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));
        boolean hasDependencies = inventoryNoteDetailRepository.existsByProduct(product)
                || productBatchRepository.existsByProduct(product);

        if (hasDependencies) {
            product.setStatus(ProductStatus.INACTIVE);
            productRepository.save(product);
            saveHistory(product, "Xóa vĩnh viễn (Hệ thống tự động chuyển sang ngừng kinh doanh vì đã có giao dịch)");
            return "Sản phẩm này đã có lịch sử nhập xuất kho. Hệ thống đã chuyển sang trạng thái 'Ngừng kinh doanh' để bảo toàn dữ liệu báo cáo.";
        } else {
            saveHistory(product, "XÓA VĨNH VIỄN");
            productRepository.delete(product);

            return "Đã xóa vĩnh viễn sản phẩm khỏi hệ thống.";
        }
    }

    public List<ProductHistory> getHistory(Long productId) {
        return historyRepository.findByProductIdOrderByTimestampDesc(productId);
    }

    /**
     * Cập nhật giá nhập sản phẩm và lưu lịch sử
     */
    @Transactional
    public Product updateProductPrice(@NonNull Long productId, BigDecimal newPrice) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

        BigDecimal oldPrice = product.getImportPrice();

        // Only save history if price actually changed
        if (oldPrice.compareTo(newPrice) != 0) {
            try {
                String username = SecurityContextHolder.getContext().getAuthentication().getName();
                User currentUser = userService.getUserByUsername(username);

                com.grocery.management.entity.PriceHistory priceHistory = new com.grocery.management.entity.PriceHistory();
                priceHistory.setProductId(productId);
                priceHistory.setOldPrice(oldPrice);
                priceHistory.setNewPrice(newPrice);
                priceHistory.setChangedBy(currentUser.getFullName());
                priceHistory.setUserRole(currentUser.getRole().name());
                priceHistory.setChangedAt(LocalDateTime.now());

                priceHistoryRepository.save(priceHistory);
            } catch (Exception e) {
                System.err.println("Không thể lưu lịch sử giá: " + e.getMessage());
            }

            product.setImportPrice(newPrice);
            Product updatedProduct = productRepository.save(product);
            saveHistory(updatedProduct, "CẬP NHẬT GIÁ: " + oldPrice + " → " + newPrice);
            return updatedProduct;
        }

        return product;
    }

    /**
     * Lấy lịch sử thay đổi giá của sản phẩm
     */
    public List<com.grocery.management.entity.PriceHistory> getPriceHistory(Long productId) {
        return priceHistoryRepository.findByProductIdOrderByChangedAtDesc(productId);
    }
}