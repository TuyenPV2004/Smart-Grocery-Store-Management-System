package com.grocery.management.service;

import com.grocery.management.dto.ChangePasswordRequest;
import com.grocery.management.dto.UserUpdateRequest;
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
import org.springframework.lang.NonNull;
import java.util.Random;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final CloudinaryImageService cloudinaryImageService;

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

    public User updateUser(@NonNull Long id, UserUpdateRequest updatedInfo) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updatedInfo.getUsername() != null
                && !updatedInfo.getUsername().isBlank()
                && !updatedInfo.getUsername().equals(targetUser.getUsername())
                && userRepository.findByUsername(updatedInfo.getUsername()).isPresent()) {
            throw new RuntimeException("Username đã tồn tại");
        }

        if (updatedInfo.getEmail() != null
                && !updatedInfo.getEmail().isBlank()
                && !updatedInfo.getEmail().equals(targetUser.getEmail())
                && userRepository.findByEmail(updatedInfo.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        if (updatedInfo.getFullName() != null) {
            targetUser.setFullName(updatedInfo.getFullName());
        }
        if (updatedInfo.getUsername() != null && !updatedInfo.getUsername().isBlank()) {
            targetUser.setUsername(updatedInfo.getUsername());
        }
        if (updatedInfo.getEmail() != null) {
            targetUser.setEmail(updatedInfo.getEmail());
        }
        if (updatedInfo.getAddress() != null) {
            targetUser.setAddress(updatedInfo.getAddress());
        }
        if (updatedInfo.getPhone() != null) {
            targetUser.setPhone(updatedInfo.getPhone());
        }

        if (updatedInfo.getPassword() != null && !updatedInfo.getPassword().isBlank()) {
            targetUser.setPassword(passwordEncoder.encode(updatedInfo.getPassword()));
        }

        return userRepository.save(targetUser);
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

        String avatarUrl = cloudinaryImageService.uploadAvatarImage(file);
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
        return avatarUrl;
    }

    public String uploadBanner(MultipartFile file) throws IOException {
        User user = getCurrentUser();

        String bannerUrl = cloudinaryImageService.uploadBannerImage(file);
        user.setBannerUrl(bannerUrl);
        userRepository.save(user);
        return bannerUrl;
    }

    // KHÁCH HÀNG TỰ ĐĂNG KÝ
    @SuppressWarnings("null")
    public User registerUser(User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username đã tồn tại");
        }
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã được sử dụng");
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

        if (user.getVerificationCode() == null || user.getVerificationExpiration() == null) {
            throw new RuntimeException("Mã OTP không hợp lệ hoặc đã hết hạn");
        }

        if (user.getVerificationExpiration().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Mã OTP đã hết hạn");
        }

        if (user.getVerificationCode().equals(otp)) {
            user.setEnabled(true);
            user.setVerificationCode(null);
            user.setVerificationExpiration(null);
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này"));

        if (user.isEnabled()) {
            throw new RuntimeException("Tài khoản này đã được xác thực. Bạn có thể đăng nhập.");
        }

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
