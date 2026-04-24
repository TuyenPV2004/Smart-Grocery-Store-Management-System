package com.grocery.management.dto;

import lombok.Data;

@Data
public class UserUpdateRequest {
    private String username;
    private String password;
    private String fullName;
    private String email;
    private String address;
    private String phone;
}
