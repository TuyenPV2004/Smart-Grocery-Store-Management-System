package com.grocery.management.service;

import com.grocery.management.dto.ChangePasswordRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.grocery.management.entity.User;
import com.grocery.management.entity.Role;
import com.grocery.management.entity.Status;
import com.grocery.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import org.springframework.lang.NonNull;
import java.util.Random;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // --- HÀM SINH MÃ NHÂN VIÊN DUY NHẤT ---
    private String generateUniqueStaffCode() {
        String code;
        Random random = new Random();
        do {
            // Sinh số ngẫu nhiên từ 0 đến 999999, format thành chuỗi 6 ký tự (VD: 001234)
            int number = random.nextInt(1000000);
            code = String.format("%06d", number);
        } while (userRepository.existsByStaffCode(code)); // Kiểm tra trùng lặp trong DB
        return code;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ADMIN TẠO TÀI KHOẢN NHÂN VIÊN
    public User createUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(Role.STAFF);
        user.setStatus(Status.ACTIVE);
        user.setEnabled(true);

        // Gọi hàm sinh mã nhân viên
        user.setStaffCode(generateUniqueStaffCode());

        return userRepository.save(user);
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    public User updateProfile(User updatedInfo) {
        User currentUser = getCurrentUser();
        currentUser.setFullName(updatedInfo.getFullName());
        currentUser.setEmail(updatedInfo.getEmail());
        currentUser.setPhone(updatedInfo.getPhone());
        currentUser.setAddress(updatedInfo.getAddress());

        return userRepository.save(currentUser);
    }

    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không đúng");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Mật khẩu xác nhận không khớp");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public User updateUserStatus(@NonNull Long id, Status status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(status);
        return userRepository.save(user);
    }

    public void deleteUser(@NonNull Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }

    public String uploadAvatar(MultipartFile file) throws IOException {
        User user = getCurrentUser();

        String uploadDir = "user-photos/" + user.getId();
        Path uploadPath = Paths.get(uploadDir);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String fileName = user.getId() + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();

        try (InputStream inputStream = file.getInputStream()) {
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            String fileUrl = "user-photos/" + user.getId() + "/" + fileName;
            user.setAvatarUrl(fileUrl);
            userRepository.save(user);

            return fileUrl;
        } catch (IOException ioe) {
            throw new IOException("Could not save image file: " + fileName, ioe);
        }
    }

    // KHÁCH HÀNG TỰ ĐĂNG KÝ
    @SuppressWarnings("null")
    public User registerUser(User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username đã tồn tại");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(Role.CUSTOMER);
        user.setStatus(Status.ACTIVE);
        user.setEnabled(false); // Đợi xác thực OTP

        // Gọi hàm sinh mã nhân viên/khách hàng duy nhất
        user.setStaffCode(generateUniqueStaffCode());

        // Sinh OTP
        String otp = String.valueOf(new Random().nextInt(900000) + 100000);
        user.setVerificationCode(otp);
        user.setVerificationExpiration(LocalDateTime.now().plusMinutes(5));

        User savedUser = userRepository.save(user);

        // Gửi Mail OTP
        emailService.sendOtpEmail(user.getEmail(), otp);

        return savedUser;
    }

    public void verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

        if (user.isEnabled()) {
            throw new RuntimeException("Tài khoản đã được xác thực trước đó.");
        }

        if (user.getVerificationExpiration().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Mã OTP đã hết hạn");
        }

        if (user.getVerificationCode().equals(otp)) {
            user.setEnabled(true);
            user.setVerificationCode(null);
            userRepository.save(user);
        } else {
            throw new RuntimeException("Mã OTP không chính xác");
        }
    }

    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống"));

        String otp = String.valueOf(new Random().nextInt(900000) + 100000);
        user.setVerificationCode(otp);
        user.setVerificationExpiration(LocalDateTime.now().plusMinutes(5));

        userRepository.save(user);
        if (user.getEmail() != null) {
            emailService.sendPasswordResetOtp(user.getEmail(), otp);
        }
    }

    public void completePasswordReset(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        if (user.getVerificationExpiration() == null
                || user.getVerificationExpiration().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Mã OTP đã hết hạn");
        }
        if (!otp.equals(user.getVerificationCode())) {
            throw new RuntimeException("Mã OTP không chính xác");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setVerificationCode(null);
        user.setVerificationExpiration(null);

        userRepository.save(user);
    }

    public User updateUserRole(@NonNull Long userId, Role newRole) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (targetUser.getRole() == Role.ADMIN) {
            throw new RuntimeException("Không được phép thay đổi quyền của Quản trị viên.");
        }

        targetUser.setRole(newRole);
        return userRepository.save(targetUser);
    }

    public void resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isEnabled())
            return;

        String otp = String.valueOf(new Random().nextInt(900000) + 100000);
        user.setVerificationCode(otp);
        user.setVerificationExpiration(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);
        if (user.getEmail() != null) {
            emailService.sendOtpEmail(user.getEmail(), otp);
        }
    }

    public User getUserByStaffCode(String staffCode) {
        return userRepository.findByStaffCode(staffCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên với mã: " + staffCode));
    }
}