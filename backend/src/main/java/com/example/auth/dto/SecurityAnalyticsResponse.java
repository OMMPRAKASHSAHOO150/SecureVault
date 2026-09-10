package com.example.auth.dto;

import com.example.auth.entity.AuditLog;
import com.example.auth.entity.LoginActivity;
import com.example.auth.entity.SecurityAlert;
import com.example.auth.entity.SuspiciousActivity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityAnalyticsResponse {

    private long totalLogins;
    private long failedLogins;
    private long suspiciousActivitiesCount;
    private long securityAlertsCount;

    private List<LoginActivity> recentLogins;
    private List<SuspiciousActivity> recentSuspiciousActivities;
    private List<SecurityAlert> recentAlerts;
    private List<AuditLog> recentAuditLogs;
}
