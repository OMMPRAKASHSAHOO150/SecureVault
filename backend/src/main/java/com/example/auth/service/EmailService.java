package com.example.auth.service;

public interface EmailService {
    void sendVerificationEmail(String email, String name, String token);
    void sendPasswordResetOtpEmail(String email, String name, String otp);
}
