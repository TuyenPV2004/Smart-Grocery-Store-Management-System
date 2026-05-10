package com.grocery.management.controller;

import com.grocery.management.entity.User;
import com.grocery.management.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return ResponseEntity.status(HttpStatus.GONE)
                .body("Dang nhap bang JWT custom da bi tat. Vui long dang nhap qua Keycloak.");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            userService.registerUser(user);
            return ResponseEntity.ok("Dang ky thanh cong. Vui long kiem tra email de lay ma OTP.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        try {
            userService.verifyOtp(request.getEmail(), request.getOtp());
            return ResponseEntity.ok("Xac thuc OTP thanh cong. Ban co the dang nhap.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody ResendOtpRequest request) {
        try {
            userService.resendOtp(request.getEmail());
            return ResponseEntity.ok("Da gui lai ma OTP moi den email cua ban.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            userService.requestPasswordReset(request.getEmail());
            return ResponseEntity.ok("Ma OTP da duoc gui den email cua ban.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            userService.completePasswordReset(request.getEmail(), request.getOtp(), request.getNewPassword());
            return ResponseEntity.ok("Dat lai mat khau thanh cong. Vui long dang nhap qua Keycloak.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

@Data
class LoginRequest {
    private String username;
    private String password;
}

@Data
class VerifyOtpRequest {
    private String email;
    private String otp;
}

@Data
class ResendOtpRequest {
    private String email;
}

@Data
class ForgotPasswordRequest {
    private String email;
}

@Data
class ResetPasswordRequest {
    private String email;
    private String otp;
    private String newPassword;
}
