package com.example.auth.controller;

import com.example.auth.dto.SecurityAnalyticsResponse;
import com.example.auth.entity.User;
import com.example.auth.service.SecurityAnalyticsService;
import com.example.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class SecurityAnalyticsController {

    private final SecurityAnalyticsService securityAnalyticsService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<SecurityAnalyticsResponse> getSecurityAnalytics() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = Long.parseLong(authentication.getName());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SecurityAnalyticsResponse response = securityAnalyticsService.getAnalyticsForUser(user);
        return ResponseEntity.ok(response);
    }
}
