package com.grocery.management.repository;

import com.grocery.management.entity.InventoryNote;
import com.grocery.management.dto.StockCardDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryNoteRepository extends JpaRepository<InventoryNote, Long> {
    boolean existsByCode(String code);

    @Query("SELECT new com.grocery.management.dto.StockCardDTO(" +
            "n.createdAt, " +
            "CAST(n.type AS string), " +
            "n.code, " +
            "n.note, " +
            "CASE WHEN n.type = com.grocery.management.entity.InventoryType.IMPORT THEN d.quantity ELSE -d.quantity END, "
            +
            "d.batchCode) " +
            "FROM InventoryNoteDetail d " +
            "JOIN d.inventoryNote n " +
            "WHERE d.product.id = :productId " +
            "ORDER BY n.createdAt ASC")
    List<StockCardDTO> getStockCardHistory(@Param("productId") Long productId);
}