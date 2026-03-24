package com.grocery.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerChatInitDTO {
    private String conversationId;
    private boolean staffOnline;
    private List<ChatMessageDTO> messages;
}
