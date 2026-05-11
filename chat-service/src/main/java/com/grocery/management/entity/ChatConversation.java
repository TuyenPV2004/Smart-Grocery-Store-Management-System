package com.grocery.management.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "chat_conversations",
        indexes = {
                @Index(name = "idx_chat_conversation_customer_key", columnList = "customer_key", unique = true),
                @Index(name = "idx_chat_conversation_updated_at", columnList = "updated_at")
        }
)
@Getter
@Setter
public class ChatConversation {

    @Id
    @Column(name = "conversation_id", nullable = false, length = 120)
    private String id;

    @Column(name = "customer_key", nullable = false, length = 120, unique = true)
    private String customerKey;

    @Column(name = "customer_display_name", nullable = false, length = 255)
    private String customerDisplayName;

    @Column(name = "customer_role", nullable = false, length = 20)
    private String customerRole;

    @Column(name = "customer_online", nullable = false)
    private boolean customerOnline;

    @Column(name = "assigned_staff_key", length = 120)
    private String assignedStaffKey;

    @Column(name = "assigned_staff_display_name", length = 255)
    private String assignedStaffDisplayName;

    @Column(name = "resolved", nullable = false)
    private boolean resolved;

    @Column(name = "last_message", columnDefinition = "TEXT")
    private String lastMessage;

    @Column(name = "last_sender_role", length = 20)
    private String lastSenderRole;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
