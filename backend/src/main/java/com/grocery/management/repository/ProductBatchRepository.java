package com.grocery.management.repository;

import com.grocery.management.entity.ProductBatch;
import com.grocery.management.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import com.grocery.management.dto.StockSummaryDTO;
import com.grocery.management.dto.BatchExpiryDTO;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {
        Optional<ProductBatch> findByBatchCode(String batchCode);

        boolean existsByProduct(Product product);

        @Query("SELECT new com.grocery.management.dto.StockSummaryDTO(" +
                        "p.id, p.sku, p.name, p.unit, 'Khong co Danh muc', " +
                        "COALESCE(CAST(SUM(b.quantity) AS long), 0L), " +
                        "COALESCE(SUM(CAST(b.quantity AS BigDecimal) * b.importPrice), 0), " +
                        "MIN(b.expiryDate), " +
                        "p.brand, p.thumbnail) " +
                        "FROM Product p " +
                        "LEFT JOIN ProductBatch b ON p.id = b.product.id AND b.quantity > 0 " +
                        "GROUP BY p.id, p.sku, p.name, p.unit, p.brand, p.thumbnail")
        List<StockSummaryDTO> getStockSummary();

        @Query("SELECT new com.grocery.management.dto.BatchExpiryDTO(" +
                        "b.id, b.batchCode, p.name, p.sku, b.quantity, " +
                        "b.manufacturingDate, b.expiryDate, s.vietnameseName) " +
                        "FROM ProductBatch b " +
                        "JOIN b.product p " +
                        "LEFT JOIN p.supplier s " +
                        "WHERE b.quantity > 0 " +
                        "ORDER BY b.expiryDate ASC")
        List<BatchExpiryDTO> getBatchesWithExpiry();

        @Query("SELECT b.batchCode FROM ProductBatch b WHERE b.batchCode LIKE :prefix%")
        List<String> findBatchCodesByPrefix(@Param("prefix") String prefix);

        @EntityGraph(attributePaths = { "inventoryNote", "product", "supplier" })
        @Override
        @NonNull
        List<ProductBatch> findAll();

        @EntityGraph(attributePaths = { "inventoryNote", "product", "supplier" })
        @Override
        @NonNull
        Page<ProductBatch> findAll(@NonNull Pageable pageable);

        List<ProductBatch> findByProductIdAndQuantityGreaterThanOrderByExpiryDateAsc(Long productId, int quantity);

        // Find available batches by product SKU for export selection (FEFO ordering)
        List<ProductBatch> findByProduct_SkuAndQuantityGreaterThanOrderByExpiryDateAsc(String sku, int minQuantity);
}