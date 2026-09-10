package com.example.auth.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityActivitySnapshotDTO {
    private long failedAttempts;
    private boolean suspicious;
    private SuspiciousActivityDTO suspiciousActivity;
    private SecurityAlertDTO securityAlert;
}
