package com.example.auth.controller;

import com.example.auth.dto.MessageResponseDTO;
import com.example.auth.dto.UserSummaryDTO;
import com.example.auth.entity.User;
import com.example.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<UserSummaryDTO>> getAllUsers() {
        List<UserSummaryDTO> users = userRepository.findAll().stream()
                .map(user -> UserSummaryDTO.builder()
                        .id(user.getId())
                        .name(user.getFullName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<MessageResponseDTO> updateUserStatus(@PathVariable Long id, @RequestParam String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(status.toUpperCase());
        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponseDTO("User status updated to " + status));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<MessageResponseDTO> updateUserRole(@PathVariable Long id, @RequestParam String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role.toUpperCase());
        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponseDTO("User role updated to " + role));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponseDTO> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(new MessageResponseDTO("User deleted successfully."));
    }
}
