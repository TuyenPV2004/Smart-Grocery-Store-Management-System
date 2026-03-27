package com.grocery.management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatSocketTicketResponseDTO {
    private String ticket;
    private String guestToken;
    private String guestDisplayName;
    private boolean authenticated;
}
