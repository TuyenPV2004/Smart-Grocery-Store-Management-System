package com.grocery.management.repository;

import com.grocery.management.entity.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, String> {

    Optional<ChatConversation> findByCustomerKey(String customerKey);

    @Query("""
            select c from ChatConversation c
            where (
                :keyword is null
                or :keyword = ''
                or lower(c.customerDisplayName) like lower(concat('%', :keyword, '%'))
                or lower(c.customerKey) like lower(concat('%', :keyword, '%'))
                or lower(coalesce(c.assignedStaffDisplayName, '')) like lower(concat('%', :keyword, '%'))
            )
            and (
                :scope = 'ALL'
                or (:scope = 'UNASSIGNED' and c.assignedStaffKey is null)
                or (:scope = 'MINE' and c.assignedStaffKey = :staffKey)
                or (:scope = 'RESOLVED' and c.resolved = true)
                or (:scope = 'ACTIVE' and c.resolved = false)
            )
            order by c.updatedAt desc
            """)
    List<ChatConversation> searchConversations(
            @Param("keyword") String keyword,
            @Param("scope") String scope,
            @Param("staffKey") String staffKey
    );
}
