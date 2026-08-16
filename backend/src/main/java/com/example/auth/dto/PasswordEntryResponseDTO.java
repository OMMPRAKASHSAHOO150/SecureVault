package com.example.auth.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PasswordEntryResponseDTO {
    private Long id;
    private String title;
    private String loginName;
    private String websiteUrl;
    private String password;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
