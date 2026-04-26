package com.grocery.management.repository;

import com.grocery.management.dto.BatchExpiryDTO;
import com.grocery.management.dto.StockSummaryDTO;
import com.grocery.management.entity.ProductBatch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {
    Optional<ProductBatch> findByBatchCode(String batchCode);

    @Query("SELECT b.batchCode FROM ProductBatch b WHERE b.batchCode LIKE CONCAT(:prefix, '%')")
    List<String> findBatchCodesByPrefix(@Param("prefix") String prefix);

    List<ProductBatch> findByProductSkuAndQuantityGreaterThanOrderByExpiryDateAsc(String sku, int minQuantity);

    List<ProductBatch> findByProductIdAndQuantityGreaterThanOrderByExpiryDateAsc(Long productId, int minQuantity);

    @Query("""
            SELECT b FROM ProductBatch b
            WHERE (:search IS NULL
                   OR LOWER(b.batchCode) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(COALESCE(b.productSku, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(COALESCE(b.productName, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(COALESCE(b.supplierName, '')) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:status IS NULL OR :status = 'ALL'
                   OR (:status = 'unknown' AND b.expiryDate IS NULL)
                   OR (:status = 'expired' AND b.expiryDate IS NOT NULL AND b.expiryDate < :today)
                   OR (:status = 'near-expiry' AND b.expiryDate IS NOT NULL AND b.expiryDate >= :today AND b.expiryDate <= :nearExpiryDate)
                   OR (:status = 'good' AND b.expiryDate IS NOT NULL AND b.expiryDate > :nearExpiryDate))
            """)
    Page<ProductBatch> searchBatches(
            @Param("search") String search,
            @Param("status") String status,
            @Param("today") LocalDate today,
            @Param("nearExpiryDate") LocalDate nearExpiryDate,
            Pageable pageable);

    @Query("""
            SELECT new com.grocery.management.dto.StockSummaryDTO(
                b.productId, b.productSku, b.productName, b.productUnit, 'Khong co Danh muc',
                COALESCE(SUM(b.quantity), 0),
                COALESCE(SUM(CAST(b.quantity AS BigDecimal) * b.importPrice), 0),
                MIN(b.expiryDate), b.productBrand,
                0L, 0L, 1, b.productThumbnail)
            FROM ProductBatch b
            GROUP BY b.productId, b.productSku, b.productName, b.productUnit, b.productBrand, b.productThumbnail
            """)
    List<StockSummaryDTO> getStockSummary();

    @Query("""
            SELECT new com.grocery.management.dto.BatchExpiryDTO(
                b.id, b.batchCode, b.productName, b.productSku, b.quantity,
                b.manufacturingDate, b.expiryDate, b.supplierName, null, null, null)
            FROM ProductBatch b
            WHERE b.quantity > 0
            ORDER BY b.expiryDate ASC
            """)
    List<BatchExpiryDTO> getBatchesWithExpiry();

    @Query("SELECT COALESCE(SUM(b.quantity), 0) FROM ProductBatch b WHERE b.productId = :productId")
    Integer getTotalQuantityByProductId(@Param("productId") Long productId);
}
