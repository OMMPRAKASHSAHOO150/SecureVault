package com.example.auth.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginActivityDTO {
    private String status;
    private Integer attemptNumber;
    private String failureReason;
    private String ipAddress;
    private LocalDateTime createdAt;
}
