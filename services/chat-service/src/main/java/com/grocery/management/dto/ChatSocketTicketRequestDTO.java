package com.grocery.management.dto;

import lombok.Data;

@Data
public class ChatSocketTicketRequestDTO {
    private String guestToken;
    private String guestDisplayName;
}
