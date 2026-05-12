package com.grocery.management.dto;

import lombok.Data;

import java.security.Principal;

@Data
public class AuthenticatedUserProfile implements Principal {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String role;

    @Override
    public String getName() {
        return username;
    }
}
