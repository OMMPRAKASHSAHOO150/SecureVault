package com.example.auth.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityAlertDTO {
    private Long id;
    private String alertType;
    private String message;
    private String severity;
    private String status;
    private LocalDateTime createdAt;
}
