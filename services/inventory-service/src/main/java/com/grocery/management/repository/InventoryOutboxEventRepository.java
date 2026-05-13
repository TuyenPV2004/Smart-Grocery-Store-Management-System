package com.grocery.management.repository;

import com.grocery.management.entity.InventoryOutboxEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface InventoryOutboxEventRepository extends JpaRepository<InventoryOutboxEvent, Long> {
    @Query("""
            SELECT e FROM InventoryOutboxEvent e
            WHERE e.status = 'PENDING'
               OR (e.status = 'PROCESSING' AND e.lockedAt < :staleBefore)
            ORDER BY e.createdAt ASC
            """)
    List<InventoryOutboxEvent> findPublishable(@Param("staleBefore") Instant staleBefore, Pageable pageable);

    @Modifying
    @Query("""
            UPDATE InventoryOutboxEvent e
            SET e.status = 'PROCESSING', e.lockedAt = :lockedAt
            WHERE e.id = :id
              AND (e.status = 'PENDING' OR (e.status = 'PROCESSING' AND e.lockedAt < :staleBefore))
            """)
    int claim(@Param("id") Long id, @Param("lockedAt") Instant lockedAt, @Param("staleBefore") Instant staleBefore);

    long countByStatusIn(Collection<String> statuses);
}
