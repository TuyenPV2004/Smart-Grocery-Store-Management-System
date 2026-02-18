package com.grocery.management.controller;

import com.grocery.management.entity.User;
import com.grocery.management.repository.UserRepository;
import com.grocery.management.service.UserService; // <--- Import UserService
import com.grocery.management.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final UserService userService; // <--- Khai báo biến này để dùng hàm register

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
        String token = jwtUtils.generateToken(user);
        return ResponseEntity.ok(new AuthResponse(token, user.getFullName(), user.getRole().name()));
    }

    // Đưa hàm register vào BÊN TRONG class
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            // --- SỬA DÒNG NÀY ---
            // Cũ (Sai): return ResponseEntity.ok(userService.createUser(user));
            
            // Mới (Đúng): Gọi hàm có logic gửi mail OTP
            return ResponseEntity.ok(userService.registerUser(user)); 
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Đưa hàm verifyOtp vào BÊN TRONG class
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        try {
            // userService.verifyOtp(request.getEmail(), request.getOtp()); // Uncomment khi đã viết hàm verifyOtp bên Service
            return ResponseEntity.ok("Tính năng xác thực đang phát triển.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API 1: Gửi yêu cầu quên mật khẩu
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            userService.requestPasswordReset(request.getEmail());
            return ResponseEntity.ok("Mã OTP đã được gửi đến email của bạn.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API 2: Đặt lại mật khẩu
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            userService.completePasswordReset(request.getEmail(), request.getOtp(), request.getNewPassword());
            return ResponseEntity.ok("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
} // <--- Đóng ngoặc class TẠI ĐÂY mới đúng

// --- Các class DTO để ở cuối file ---

@Data
class LoginRequest {
    private String username;
    private String password;
}

@Data
@AllArgsConstructor
class AuthResponse {
    private String token;
    private String fullName;
    private String role;
}

@Data
class VerifyOtpRequest { 
    private String email; 
    private String otp; 
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

