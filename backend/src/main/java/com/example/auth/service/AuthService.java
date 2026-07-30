package com.example.auth.service;

import com.example.auth.dto.*;

public interface AuthService {
    RegisterResponseDTO register(RegisterRequestDTO request);
    void verifyEmail(String token);
    void resendVerificationEmail(String email);
    AuthResponseDTO login(LoginRequestDTO request);
    AuthResponseDTO refreshToken(String refreshToken);
    void logout(String refreshToken);
}
