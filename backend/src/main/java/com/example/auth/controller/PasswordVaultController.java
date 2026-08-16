package com.example.auth.controller;

import com.example.auth.dto.PasswordEntryRequestDTO;
import com.example.auth.dto.PasswordEntryResponseDTO;
import com.example.auth.dto.SharePasswordEntryRequestDTO;
import com.example.auth.dto.SharedPasswordEntryResponseDTO;
import com.example.auth.service.PasswordVaultService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vault")
public class PasswordVaultController {

    private final PasswordVaultService passwordVaultService;

    public PasswordVaultController(PasswordVaultService passwordVaultService) {
        this.passwordVaultService = passwordVaultService;
    }

    @GetMapping
    public ResponseEntity<List<PasswordEntryResponseDTO>> listEntries() {
        return ResponseEntity.ok(passwordVaultService.getEntriesForCurrentUser());
    }

    @GetMapping("/shared")
    public ResponseEntity<List<PasswordEntryResponseDTO>> listSharedEntries() {
        return ResponseEntity.ok(passwordVaultService.getSharedEntriesForCurrentUser());
    }

    @PostMapping
    public ResponseEntity<PasswordEntryResponseDTO> createEntry(@Valid @RequestBody PasswordEntryRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(passwordVaultService.createEntry(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PasswordEntryResponseDTO> updateEntry(
            @PathVariable Long id,
            @Valid @RequestBody PasswordEntryRequestDTO request) {
        return ResponseEntity.ok(passwordVaultService.updateEntry(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long id) {
        passwordVaultService.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/share")
    public ResponseEntity<SharedPasswordEntryResponseDTO> shareEntry(@Valid @RequestBody SharePasswordEntryRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(passwordVaultService.shareEntry(request));
    }

    @DeleteMapping("/share/{shareId}")
    public ResponseEntity<Void> revokeShare(@PathVariable Long shareId) {
        passwordVaultService.revokeShare(shareId);
        return ResponseEntity.noContent().build();
    }
}
