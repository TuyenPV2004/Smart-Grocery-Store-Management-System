package com.grocery.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.grocery.management.dto.ProductRequest;
import com.grocery.management.entity.Product;
import com.grocery.management.entity.ProductStatus;
import com.grocery.management.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping
    public ResponseEntity<?> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null || size != null) {
            int safePage = page != null ? Math.max(page, 0) : 0;
            int safeSize = size != null ? Math.max(size, 1) : 20;
            return ResponseEntity.ok(productService.getProductsPage(keyword, status, categoryId, safePage, safeSize));
        }
        return ResponseEntity.ok(productService.getAllProducts(keyword, status, categoryId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(productService.getProductById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/snapshot")
    public ResponseEntity<?> getProductSnapshot(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(productService.getProductSnapshot(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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
            return ResponseEntity.badRequest().body("Loi xu ly du lieu: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable @NonNull Long id) {
        try {
            return ResponseEntity.ok(productService.deleteProduct(id));
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

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile image) {
        try {
            return ResponseEntity.ok(productService.uploadImage(id, image));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<?> deleteImage(@PathVariable Long id, @PathVariable Long imageId) {
        try {
            productService.deleteImage(id, imageId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/price")
    public ResponseEntity<?> updateProductPrice(@PathVariable @NonNull Long id, @RequestBody Map<String, BigDecimal> request) {
        try {
            BigDecimal newPrice = request.get("newPrice");
            if (newPrice == null) {
                return ResponseEntity.badRequest().body("Gia moi khong duoc de trong");
            }
            return ResponseEntity.ok(productService.updateProductPrice(id, newPrice));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/sell-price")
    public ResponseEntity<Product> updateSellPrice(@PathVariable Long id, @RequestParam BigDecimal newPrice) {
        return ResponseEntity.ok(productService.updateSellPrice(id, newPrice));
    }

    @GetMapping("/{id}/price-history")
    public ResponseEntity<?> getPriceHistory(@PathVariable @NonNull Long id) {
        try {
            return ResponseEntity.ok(productService.getPriceHistory(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
