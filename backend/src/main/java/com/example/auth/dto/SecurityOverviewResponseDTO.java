package com.example.auth.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityOverviewResponseDTO {
    private List<SecurityAlertDTO> securityAlerts;
    private List<SuspiciousActivityDTO> suspiciousActivities;
    private List<AuditLogDTO> auditLogs;
}
