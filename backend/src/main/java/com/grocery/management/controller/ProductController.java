package com.grocery.management.controller;

import com.grocery.management.dto.ProductRequest;
import com.grocery.management.entity.Product;
import com.grocery.management.entity.ProductStatus;
import com.grocery.management.service.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<Product>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ProductStatus status) {
        return ResponseEntity.ok(productService.getAllProducts(keyword, status));
    }

    @PostMapping
    public ResponseEntity<?> createProduct(
            @RequestParam("product") String productJson,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());

            Product product = mapper.readValue(productJson, Product.class);
            return ResponseEntity.ok(productService.createProduct(product, image));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable @NonNull Long id,
            @RequestParam("product") String productJson,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());

            Product product = mapper.readValue(productJson, Product.class);
            return ResponseEntity.ok(productService.updateProduct(id, product, image));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi xử lý dữ liệu: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable @NonNull Long id) {
        try {
            String message = productService.deleteProduct(id);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getProductHistory(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getHistory(id));
    }

    @PostMapping(value = "/quick", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Product> createQuickProduct(
            @ModelAttribute ProductRequest request,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile) throws IOException {
        return ResponseEntity.ok(productService.createQuickProduct(request, imageFile));
    }

    /**
     * Cập nhật giá nhập sản phẩm
     */
    @PutMapping("/{id}/price")
    public ResponseEntity<?> updateProductPrice(
            @PathVariable @NonNull Long id,
            @RequestBody Map<String, BigDecimal> request) {
        try {
            BigDecimal newPrice = request.get("newPrice");
            if (newPrice == null) {
                return ResponseEntity.badRequest().body("Giá mới không được để trống");
            }
            Product updatedProduct = productService.updateProductPrice(id, newPrice);
            return ResponseEntity.ok(updatedProduct);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Lấy lịch sử thay đổi giá của sản phẩm
     */
    @GetMapping("/{id}/price-history")
    public ResponseEntity<?> getPriceHistory(@PathVariable @NonNull Long id) {
        try {
            return ResponseEntity.ok(productService.getPriceHistory(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}