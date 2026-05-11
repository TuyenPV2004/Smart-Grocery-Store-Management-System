package com.grocery.management.dto;

import lombok.Data;

@Data
public class ChatInboundMessageDTO {
    private String type;
    private String conversationId;
    private String content;
    private Boolean typing;
}
