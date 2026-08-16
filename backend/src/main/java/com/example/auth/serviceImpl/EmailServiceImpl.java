package com.example.auth.serviceImpl;

import com.example.auth.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    // Mark as optional to avoid startup crash when SMTP properties are not configured in dev
    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.mode}")
    private String mailMode;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.mail.from:}")
    private String fromAddress;

    @Override
    public void sendVerificationEmail(String email, String name, String token) {
        String verificationLink = frontendUrl + "/verify?token=" + token;
        
        String htmlContent = "<html>" +
                "<body style='font-family: Arial, sans-serif; background-color: #0f0f1a; color: #ffffff; padding: 40px; text-align: center;'>" +
                "<div style='max-width: 600px; margin: 0 auto; background-color: #1e1e2e; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); border: 1px solid #313244;'>" +
                "<h2 style='color: #89b4fa; font-size: 24px; margin-bottom: 20px;'>Verify Your Email Address</h2>" +
                "<p style='color: #cdd6f4; font-size: 16px; line-height: 1.6;'>Hello " + name + ",</p>" +
                "<p style='color: #cdd6f4; font-size: 16px; line-height: 1.6;'>Thank you for registering at Password Vault. Please click the button below to verify your email address and activate your account:</p>" +
                "<div style='margin: 30px 0;'>" +
                "<a href='" + verificationLink + "' style='background-color: #89b4fa; color: #11111b; text-decoration: none; padding: 12px 30px; font-weight: bold; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 10px rgba(137, 180, 250, 0.4); display: inline-block;'>Verify Email</a>" +
                "</div>" +
                "<p style='color: #a6adc8; font-size: 14px;'>If the button doesn't work, copy and paste this link into your browser:</p>" +
                "<p style='color: #89b4fa; word-break: break-all; font-size: 14px;'>" + verificationLink + "</p>" +
                "<hr style='border: 0; border-top: 1px solid #313244; margin: 30px 0;'>" +
                "<p style='color: #585b70; font-size: 12px;'>This link will expire in 24 hours. If you did not request this, please ignore this email.</p>" +
                "</div>" +
                "</body>" +
                "</html>";

        if ("dev".equalsIgnoreCase(mailMode)) {
            log.info("\n================ MOCK EMAIL SENT ================\n" +
                    "To: {}\n" +
                    "Subject: Verify Your Email\n" +
                    "Verification Link: {}\n" +
                    "=================================================", email, verificationLink);

            // Write HTML file to backend/emails/ for local opening
            try {
                Files.createDirectories(Paths.get("emails"));
                File emailFile = new File("emails/verification-" + email.replace("@", "_at_") + ".html");
                try (FileWriter writer = new FileWriter(emailFile)) {
                    writer.write(htmlContent);
                }
                log.info("Email written to file: {}", emailFile.getAbsolutePath());
            } catch (IOException e) {
                log.error("Failed to write mock email file", e);
            }
        } else {
            if (mailSender == null) {
                log.error("Email Mode is SMTP but JavaMailSender bean is not configured!");
                throw new RuntimeException("SMTP email sender is not configured on the server.");
            }
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                if (fromAddress != null && !fromAddress.isBlank()) {
                    helper.setFrom(fromAddress);
                }
                helper.setTo(email);
                helper.setSubject("Verify Your Email Address - Password Vault");
                helper.setText(htmlContent, true);
                mailSender.send(message);
                log.info("Email successfully sent to {}", email);
            } catch (Exception e) {
                log.error("Failed to send real SMTP email to {}", email, e);
                throw new RuntimeException("Email sending failed: " + e.getMessage());
            }
        }
    }

    @Override
    public void sendPasswordResetOtpEmail(String email, String name, String otp) {
        String htmlContent = "<html>" +
                "<body style='font-family: Arial, sans-serif; background-color: #0f0f1a; color: #ffffff; padding: 40px; text-align: center;'>" +
                "<div style='max-width: 600px; margin: 0 auto; background-color: #1e1e2e; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); border: 1px solid #313244;'>" +
                "<h2 style='color: #f38ba8; font-size: 24px; margin-bottom: 20px;'>Password Reset OTP</h2>" +
                "<p style='color: #cdd6f4; font-size: 16px; line-height: 1.6;'>Hello " + name + ",</p>" +
                "<p style='color: #cdd6f4; font-size: 16px; line-height: 1.6;'>Use the OTP below to reset your password:</p>" +
                "<div style='margin: 30px 0;'>" +
                "<div style='display: inline-block; background-color: #11111b; border: 1px solid #f38ba8; color: #f9e2af; padding: 14px 24px; font-size: 28px; letter-spacing: 6px; font-weight: bold; border-radius: 10px;'>" + otp + "</div>" +
                "</div>" +
                "<p style='color: #a6adc8; font-size: 14px;'>This OTP expires in 10 minutes and can be used only once.</p>" +
                "</div>" +
                "</body>" +
                "</html>";

        if ("dev".equalsIgnoreCase(mailMode)) {
            log.info("\n================ MOCK EMAIL SENT ================\n" +
                    "To: {}\n" +
                    "Subject: Password Reset OTP\n" +
                    "OTP: {}\n" +
                    "=================================================", email, otp);

            try {
                Files.createDirectories(Paths.get("emails"));
                File emailFile = new File("emails/password-reset-" + email.replace("@", "_at_") + ".html");
                try (FileWriter writer = new FileWriter(emailFile)) {
                    writer.write(htmlContent);
                }
                log.info("Email written to file: {}", emailFile.getAbsolutePath());
            } catch (IOException e) {
                log.error("Failed to write mock password reset email file", e);
            }
        } else {
            if (mailSender == null) {
                log.error("Email Mode is SMTP but JavaMailSender bean is not configured!");
                throw new RuntimeException("SMTP email sender is not configured on the server.");
            }
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                if (fromAddress != null && !fromAddress.isBlank()) {
                    helper.setFrom(fromAddress);
                }
                helper.setTo(email);
                helper.setSubject("Password Reset OTP - Password Vault");
                helper.setText(htmlContent, true);
                mailSender.send(message);
                log.info("Password reset email successfully sent to {}", email);
            } catch (Exception e) {
                log.error("Failed to send password reset email to {}", email, e);
                throw new RuntimeException("Email sending failed: " + e.getMessage());
            }
        }
    }
}
