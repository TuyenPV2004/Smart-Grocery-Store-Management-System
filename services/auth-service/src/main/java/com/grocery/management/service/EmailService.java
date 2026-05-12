package com.grocery.management.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    public void sendOtpEmail(@NonNull String to, @NonNull String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setTo(to);
            helper.setSubject("Mã xác thực đăng ký Grocery Store");
            helper.setText("<h3>Xin chào,</h3>" +
                    "<p>Mã xác thực (OTP) của bạn là: <b style='color:blue; font-size:20px;'>" + otp + "</b></p>" +
                    "<p>Mã này sẽ hết hạn sau 5 phút.</p>", true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Không thể gửi email: " + e.getMessage());
        }
    }
    public void sendPasswordResetOtp(@NonNull String to, @NonNull String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setTo(to);
            helper.setSubject("Yêu cầu đặt lại mật khẩu - Grocery Store");
            helper.setText("<h3>Xin chào,</h3>" +
                    "<p>Bạn vừa yêu cầu đặt lại mật khẩu. Mã OTP của bạn là: <b style='color:red; font-size:20px;'>" + otp + "</b></p>" +
                    "<p>Mã này sẽ hết hạn sau 5 phút. Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.</p>", true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Lỗi gửi email: " + e.getMessage());
        }
    }
}