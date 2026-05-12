package com.grocery.management.service;

import com.grocery.management.dto.ProductRequest;
import com.grocery.management.dto.ProductSnapshotResponse;
import com.grocery.management.entity.PriceHistory;
import com.grocery.management.entity.Product;
import com.grocery.management.entity.ProductHistory;
import com.grocery.management.entity.ProductImage;
import com.grocery.management.entity.ProductStatus;
import com.grocery.management.repository.PriceHistoryRepository;
import com.grocery.management.repository.ProductHistoryRepository;
import com.grocery.management.repository.ProductImageRepository;
import com.grocery.management.repository.ProductRepository;
import com.grocery.management.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductHistoryRepository historyRepository;
    private final ProductImageRepository productImageRepository;
    private final SupplierRepository supplierRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final CloudinaryImageService cloudinaryImageService;

    public List<Product> getAllProducts(String keyword, ProductStatus status, Long categoryId) {
        return productRepository.searchProducts(keyword, status, categoryId);
    }

    public Page<Product> getProductsPage(String keyword, ProductStatus status, Long categoryId, int page, int size) {
        return productRepository.searchProductsPage(keyword, status, categoryId, PageRequest.of(page, size));
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay san pham voi ID: " + id));
    }

    public ProductSnapshotResponse getProductSnapshot(Long id) {
        Product product = getProductById(id);
        return new ProductSnapshotResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getUnit(),
                product.getSellPrice(),
                product.getThumbnail(),
                product.getStatus() != null ? product.getStatus().name() : null);
    }

    private void saveHistory(Product product, String action) {
        ProductHistory history = new ProductHistory();
        history.setProductId(product.getId());
        history.setProductName(product.getName());
        history.setSku(product.getSku());
        history.setAction(action);
        history.setPerformedBy("catalog-service");
        history.setRole("SYSTEM");
        history.setTimestamp(LocalDateTime.now());
        historyRepository.save(history);
    }

    @Transactional
    public Product createProduct(Product product, MultipartFile imageFile) throws IOException {
        if (productRepository.existsBySku(product.getSku())) {
            throw new RuntimeException("Ma SKU da ton tai: " + product.getSku());
        }
        if (productRepository.existsByBarcode(product.getBarcode())) {
            throw new RuntimeException("Ma vach da ton tai: " + product.getBarcode());
        }

        if (product.getSupplier() != null && product.getSupplier().getId() != null) {
            Long supplierId = product.getSupplier().getId();
            product.setSupplier(supplierRepository.findById(supplierId)
                    .orElseThrow(() -> new RuntimeException("Khong tim thay nha cung cap voi ID: " + supplierId)));
        } else {
            product.setSupplier(null);
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            product.setThumbnail(cloudinaryImageService.uploadProductImage(imageFile));
        }

        Product savedProduct = productRepository.save(product);
        saveHistory(savedProduct, "THEM MOI");

        if (savedProduct.getImportPrice() != null && savedProduct.getImportPrice().compareTo(BigDecimal.ZERO) > 0) {
            PriceHistory priceHistory = new PriceHistory();
            priceHistory.setProductId(savedProduct.getId());
            priceHistory.setOldPrice(BigDecimal.ZERO);
            priceHistory.setNewPrice(savedProduct.getImportPrice());
            priceHistory.setChangedBy("catalog-service");
            priceHistory.setUserRole("SYSTEM");
            priceHistory.setChangedAt(LocalDateTime.now());
            priceHistory.setPriceType(PriceHistory.PriceType.IMPORT);
            priceHistoryRepository.save(priceHistory);
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
        String sku = request.getSku();
        if (sku == null || sku.isBlank()) {
            do {
                int randomNum = (int) ((Math.random() * (999999 - 100000)) + 100000);
                sku = "SKU-" + randomNum;
            } while (productRepository.existsBySku(sku));
        } else if (productRepository.existsBySku(sku)) {
            throw new RuntimeException("Ma SKU da ton tai: " + sku);
        }
        product.setSku(sku);
        product.setStockQuantity(0);
        product.setSellPrice(request.getSellPrice() != null ? request.getSellPrice() : BigDecimal.ZERO);
        product.setUnit("Cai");
        product.setStatus(request.getStatus() != null ? request.getStatus() : ProductStatus.ACTIVE);
        product.setImportPrice(request.getImportPrice() != null ? request.getImportPrice() : BigDecimal.ZERO);
        product.setShelfLife(request.getShelfLife() != null ? request.getShelfLife() : 0);
        product.setDescription(request.getDescription());

        if (imageFile != null && !imageFile.isEmpty()) {
            product.setThumbnail(cloudinaryImageService.uploadProductImage(imageFile));
        }

        Product savedProduct = productRepository.save(product);
        saveHistory(savedProduct, "TAO NHANH");
        return savedProduct;
    }

    @Transactional
    public Product updateProduct(@NonNull Long id, Product input, MultipartFile imageFile) throws IOException {
        Product existing = getProductById(id);

        if (!existing.getSku().equals(input.getSku()) && productRepository.existsBySku(input.getSku())) {
            throw new RuntimeException("Ma SKU da ton tai");
        }
        if (!existing.getBarcode().equals(input.getBarcode()) && productRepository.existsByBarcode(input.getBarcode())) {
            throw new RuntimeException("Ma vach da ton tai");
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
        existing.setLabels(input.getLabels());
        existing.setMinStock(input.getMinStock());
        existing.setStockQuantity(input.getStockQuantity());
        existing.setLocation(input.getLocation());
        existing.setShelfLife(input.getShelfLife());

        if (input.getSupplier() != null && input.getSupplier().getId() != null) {
            Long supplierId = input.getSupplier().getId();
            existing.setSupplier(supplierRepository.findById(supplierId)
                    .orElseThrow(() -> new RuntimeException("Khong tim thay nha cung cap voi ID: " + supplierId)));
        } else {
            existing.setSupplier(null);
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            cloudinaryImageService.deleteImageByUrl(existing.getThumbnail());
            existing.setThumbnail(cloudinaryImageService.uploadProductImage(imageFile));
        }

        Product updatedProduct = productRepository.save(existing);
        saveHistory(updatedProduct, "CAP NHAT");
        return updatedProduct;
    }

    @Transactional
    public String deleteProduct(@NonNull Long id) {
        Product product = getProductById(id);
        saveHistory(product, "XOA VINH VIEN");
        productRepository.delete(product);
        return "Da xoa vinh vien san pham khoi he thong.";
    }

    public List<ProductHistory> getHistory(Long productId) {
        return historyRepository.findByProductIdOrderByTimestampDesc(productId);
    }

    @Transactional
    public Product updateProductPrice(@NonNull Long productId, BigDecimal newPrice) {
        Product product = getProductById(productId);
        BigDecimal oldPrice = product.getImportPrice();

        if (oldPrice.compareTo(newPrice) != 0) {
            PriceHistory priceHistory = new PriceHistory();
            priceHistory.setProductId(productId);
            priceHistory.setOldPrice(oldPrice);
            priceHistory.setNewPrice(newPrice);
            priceHistory.setChangedBy("catalog-service");
            priceHistory.setUserRole("SYSTEM");
            priceHistory.setChangedAt(LocalDateTime.now());
            priceHistory.setPriceType(PriceHistory.PriceType.IMPORT);
            priceHistoryRepository.save(priceHistory);

            product.setImportPrice(newPrice);
            Product updatedProduct = productRepository.save(product);
            saveHistory(updatedProduct, "CAP NHAT GIA NHAP");
            return updatedProduct;
        }

        return product;
    }

    public List<PriceHistory> getPriceHistory(Long productId) {
        return priceHistoryRepository.findByProductIdOrderByChangedAtDesc(productId);
    }

    @Transactional
    public Product updateSellPrice(@NonNull Long productId, BigDecimal newPrice) {
        Product product = getProductById(productId);
        BigDecimal oldPrice = product.getSellPrice() != null ? product.getSellPrice() : BigDecimal.ZERO;

        if (oldPrice.compareTo(newPrice) != 0) {
            PriceHistory priceHistory = new PriceHistory();
            priceHistory.setProductId(productId);
            priceHistory.setOldPrice(oldPrice);
            priceHistory.setNewPrice(newPrice);
            priceHistory.setChangedBy("catalog-service");
            priceHistory.setUserRole("SYSTEM");
            priceHistory.setChangedAt(LocalDateTime.now());
            priceHistory.setPriceType(PriceHistory.PriceType.SELL);
            priceHistoryRepository.save(priceHistory);

            product.setSellPrice(newPrice);
            Product updatedProduct = productRepository.save(product);
            saveHistory(updatedProduct, "CAP NHAT GIA BAN");
            return updatedProduct;
        }

        return product;
    }

    @Transactional
    public ProductImage uploadImage(Long productId, MultipartFile imageFile) throws IOException {
        Product product = getProductById(productId);
        if (imageFile == null || imageFile.isEmpty()) {
            throw new RuntimeException("Vui long chon anh de tai len");
        }

        ProductImage productImage = new ProductImage();
        productImage.setProduct(product);
        productImage.setImageUrl(cloudinaryImageService.uploadProductImage(imageFile));
        return productImageRepository.save(productImage);
    }

    @Transactional
    public void deleteImage(Long productId, Long imageId) {
        getProductById(productId);
        ProductImage productImage = productImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Khong tim thay anh"));

        if (!productImage.getProduct().getId().equals(productId)) {
            throw new RuntimeException("Anh khong thuoc san pham nay");
        }

        productImageRepository.delete(productImage);
        cloudinaryImageService.deleteImageByUrl(productImage.getImageUrl());
    }
}
