package com.grocery.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TypingStatusDTO {
    private String conversationId;
    private String senderKey;
    private String senderDisplayName;
    private String senderRole;
    private boolean typing;
}
