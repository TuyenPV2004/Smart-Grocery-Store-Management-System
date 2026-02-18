package com.grocery.management.repository;

import com.grocery.management.entity.InventoryNoteDetail;
import com.grocery.management.entity.Product; // Đừng quên import Product
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InventoryNoteDetailRepository extends JpaRepository<InventoryNoteDetail, Long> {
    List<InventoryNoteDetail> findByInventoryNoteId(Long noteId);

    boolean existsByProduct(Product product);

    @org.springframework.data.jpa.repository.Query("SELECT d.product.id, n.type, " +
            "SUM(CASE WHEN n.type = com.grocery.management.entity.InventoryType.IMPORT THEN d.quantityInImportUnit ELSE d.quantity END), "
            +
            "MAX(d.conversionRate) " +
            "FROM InventoryNoteDetail d JOIN d.inventoryNote n " +
            "WHERE n.status = 'COMPLETED' " +
            "GROUP BY d.product.id, n.type")
    List<Object[]> getProductFlowStats();
}