package com.example.auth.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PasswordEntryResponseDTO {
    private Long id;
    private Long shareId;
    private String title;
    private String loginName;
    private String websiteUrl;
    private String password;
    private String notes;
    private String permission;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
