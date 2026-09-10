package com.example.auth.controller;

import com.example.auth.dto.MessageResponseDTO;
import com.example.auth.dto.UpdateProfileRequestDTO;
import com.example.auth.entity.User;
import com.example.auth.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserRepository userRepository;

    @PutMapping
    public ResponseEntity<MessageResponseDTO> updateProfile(@Valid @RequestBody UpdateProfileRequestDTO request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Unauthorized");
        }
        Long userId = Long.parseLong(authentication.getName());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFullName(request.getFullName().trim());
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponseDTO("Profile updated successfully."));
    }
}
