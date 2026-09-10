package com.example.auth.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuspiciousActivityDTO {
    private Long id;
    private String activityType;
    private String description;
    private Integer failedAttempts;
    private String status;
    private LocalDateTime detectedAt;
}
