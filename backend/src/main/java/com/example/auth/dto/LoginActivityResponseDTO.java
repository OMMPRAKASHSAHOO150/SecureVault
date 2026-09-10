package com.example.auth.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginActivityResponseDTO {
    private long totalAttempts;
    private long failedAttempts;
    private long successfulLogins;
    private List<LoginActivityDTO> recentActivities;
}
