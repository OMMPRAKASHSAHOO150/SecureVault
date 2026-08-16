package com.example.auth.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SharedPasswordEntryResponseDTO {
    private Long id;
    private Long passwordEntryId;
    private Long ownerUserId;
    private Long recipientUserId;
    private String permission;
    private String password;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
