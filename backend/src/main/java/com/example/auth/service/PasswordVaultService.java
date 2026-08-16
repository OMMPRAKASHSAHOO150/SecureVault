package com.example.auth.service;

import com.example.auth.dto.PasswordEntryRequestDTO;
import com.example.auth.dto.PasswordEntryResponseDTO;
import com.example.auth.dto.SharePasswordEntryRequestDTO;
import com.example.auth.dto.SharedPasswordEntryResponseDTO;

import java.util.List;

public interface PasswordVaultService {
    List<PasswordEntryResponseDTO> getEntriesForCurrentUser();
    List<PasswordEntryResponseDTO> getSharedEntriesForCurrentUser();
    PasswordEntryResponseDTO createEntry(PasswordEntryRequestDTO request);
    PasswordEntryResponseDTO updateEntry(Long id, PasswordEntryRequestDTO request);
    void deleteEntry(Long id);
    SharedPasswordEntryResponseDTO shareEntry(SharePasswordEntryRequestDTO request);
    void revokeShare(Long shareId);
}
