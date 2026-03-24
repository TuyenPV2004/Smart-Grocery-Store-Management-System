package com.grocery.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private String id;
    private String conversationId;
    private String senderKey;
    private String senderDisplayName;
    private String senderRole;
    private String content;
    private LocalDateTime createdAt;
}
