package com.grocery.management.service;

import com.grocery.management.dto.ProductSnapshot;
import com.grocery.management.dto.SupplierSnapshot;
import com.grocery.management.exception.CatalogReferenceException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogClient {
    private final RestTemplate restTemplate;

    @Value("${services.catalog.url}")
    private String catalogUrl;

    public ProductSnapshot getProductById(Long productId) {
        return restTemplate.getForObject(catalogUrl + "/api/products/" + productId, ProductSnapshot.class);
    }

    public ProductSnapshot getProductBySku(String sku) {
        List<ProductSnapshot> products = restTemplate.exchange(
                catalogUrl + "/api/products?keyword={sku}",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<ProductSnapshot>>() {
                },
                sku).getBody();
        if (products == null || products.isEmpty()) {
            throw new CatalogReferenceException("SKU not found: " + sku);
        }
        return products.stream()
                .filter(product -> sku.equalsIgnoreCase(product.getSku()))
                .findFirst()
                .orElse(products.getFirst());
    }

    public SupplierSnapshot getSupplierById(Long supplierId) {
        List<SupplierSnapshot> suppliers = restTemplate.exchange(
                catalogUrl + "/api/suppliers",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<SupplierSnapshot>>() {
                }).getBody();
        if (suppliers == null) {
            throw new CatalogReferenceException("Khong lay duoc danh sach nha cung cap");
        }
        return suppliers.stream()
                .filter(supplier -> supplierId.equals(supplier.getId()))
                .findFirst()
                .orElseThrow(() -> new CatalogReferenceException("Khong tim thay nha cung cap voi ID: " + supplierId));
    }
}
