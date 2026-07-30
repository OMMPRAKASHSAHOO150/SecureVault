package com.example.auth.controller;

import com.example.auth.dto.*;
import com.example.auth.entity.User;
import com.example.auth.repository.UserRepository;
import com.example.auth.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponseDTO> register(@Valid @RequestBody RegisterRequestDTO request) {
        RegisterResponseDTO response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/verify")
    public ResponseEntity<MessageResponseDTO> verify(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(new MessageResponseDTO("Email verified successfully. You can now login."));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<MessageResponseDTO> resendVerification(@Valid @RequestBody ResendVerificationRequestDTO request) {
        authService.resendVerificationEmail(request.getEmail());
        return ResponseEntity.ok(new MessageResponseDTO("Verification email resent successfully. Please check your inbox."));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO request, HttpServletResponse response) {
        AuthResponseDTO authResponse = authService.login(request);
        
        // Set Refresh Token as HTTP-Only Cookie
        ResponseCookie cookie = ResponseCookie.from("refreshToken", authResponse.getRefreshToken())
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .path("/")
                .maxAge(604800) // 7 days in seconds
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refresh(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestBody(required = false) RefreshTokenRequestDTO bodyRefreshToken,
            HttpServletResponse response) {

        String token = null;
        if (cookieRefreshToken != null && !cookieRefreshToken.isBlank()) {
            token = cookieRefreshToken;
        } else if (bodyRefreshToken != null && bodyRefreshToken.getRefreshToken() != null) {
            token = bodyRefreshToken.getRefreshToken();
        }

        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Refresh token is missing. Please sign in again."));
        }

        AuthResponseDTO authResponse = authService.refreshToken(token);

        // Reset/Rotate HTTP-Only cookie with the new refresh token
        ResponseCookie cookie = ResponseCookie.from("refreshToken", authResponse.getRefreshToken())
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(604800)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponseDTO> logout(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestBody(required = false) RefreshTokenRequestDTO bodyRefreshToken,
            HttpServletResponse response) {

        String token = null;
        if (cookieRefreshToken != null && !cookieRefreshToken.isBlank()) {
            token = cookieRefreshToken;
        } else if (bodyRefreshToken != null && bodyRefreshToken.getRefreshToken() != null) {
            token = bodyRefreshToken.getRefreshToken();
        }

        if (token != null && !token.isBlank()) {
            authService.logout(token);
        }

        // Clear HTTP-Only cookie
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0) // Expire immediately
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(new MessageResponseDTO("Logout successful."));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        
        Long userId = Long.parseLong(authentication.getName());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found in database"));

        UserSummaryDTO summary = UserSummaryDTO.builder()
                .id(user.getId())
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();

        return ResponseEntity.ok(summary);
    }
}
