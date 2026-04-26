package com.grocery.management.repository;

import com.grocery.management.entity.InventoryNoteDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface InventoryNoteDetailRepository extends JpaRepository<InventoryNoteDetail, Long> {
    List<InventoryNoteDetail> findByInventoryNoteId(Long noteId);

    @Query("""
            SELECT d.productId, n.type,
                   SUM(CASE WHEN n.type = com.grocery.management.entity.InventoryType.IMPORT THEN d.quantityInImportUnit ELSE d.quantity END),
                   MAX(d.conversionRate)
            FROM InventoryNoteDetail d
            JOIN d.inventoryNote n
            WHERE n.status = com.grocery.management.entity.InventoryStatus.COMPLETED
            GROUP BY d.productId, n.type
            """)
    List<Object[]> getProductFlowStats();
}
