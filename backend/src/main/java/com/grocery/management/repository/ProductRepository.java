package com.grocery.management.repository;

import com.grocery.management.entity.Product;
import com.grocery.management.entity.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsBySku(String sku);

    boolean existsByBarcode(String barcode);

    boolean existsByCategoryId(Long categoryId);

    @Query("SELECT DISTINCT p FROM Product p " +
            "LEFT JOIN FETCH p.supplier " +
            "LEFT JOIN FETCH p.category " +
            "WHERE (:keyword IS NULL OR p.name LIKE %:keyword% OR p.brand LIKE %:keyword% OR p.barcode LIKE %:keyword%) AND "
            +
            "(:status IS NULL OR p.status = :status)")
    List<Product> searchProducts(String keyword, ProductStatus status);

    Optional<Product> findBySku(String sku);

    Optional<Product> findByBarcode(String barcode);

    @Query("SELECT p FROM Product p WHERE p.stockQuantity <= p.minStock")
    List<Product> findByStockQuantityLessThanEqualMinStock();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.stockQuantity <= p.minStock")
    long countLowStock();
}