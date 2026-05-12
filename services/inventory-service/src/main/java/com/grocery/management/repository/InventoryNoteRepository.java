package com.grocery.management.repository;

import com.grocery.management.dto.StockCardDTO;
import com.grocery.management.entity.InventoryNote;
import com.grocery.management.entity.InventoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InventoryNoteRepository extends JpaRepository<InventoryNote, Long> {
    boolean existsByCode(String code);

    @Query("""
            SELECT new com.grocery.management.dto.StockCardDTO(
                n.createdAt,
                CAST(n.type AS string),
                n.code,
                n.note,
                CASE WHEN n.type = com.grocery.management.entity.InventoryType.IMPORT THEN d.quantity ELSE -d.quantity END,
                0,
                d.batchCode)
            FROM InventoryNoteDetail d
            JOIN d.inventoryNote n
            WHERE d.productId = :productId
            ORDER BY n.createdAt ASC
            """)
    List<StockCardDTO> getStockCardHistory(@Param("productId") Long productId);

    long countByType(InventoryType type);
}
