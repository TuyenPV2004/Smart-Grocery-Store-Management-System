package com.grocery.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatConversationSummaryDTO {
    private String conversationId;
    private String customerKey;
    private String customerDisplayName;
    private String customerRole;
    private boolean customerOnline;
    private String assignedStaffKey;
    private String assignedStaffDisplayName;
    private boolean resolved;
    private String lastMessage;
    private String lastSenderRole;
    private LocalDateTime updatedAt;
}
