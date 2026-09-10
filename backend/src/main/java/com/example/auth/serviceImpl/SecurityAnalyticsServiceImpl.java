package com.example.auth.serviceImpl;

import com.example.auth.dto.SecurityAnalyticsResponse;
import com.example.auth.entity.*;
import com.example.auth.repository.*;
import com.example.auth.service.SecurityAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SecurityAnalyticsServiceImpl implements SecurityAnalyticsService {

    private final LoginActivityRepository loginActivityRepository;
    private final SuspiciousActivityRepository suspiciousActivityRepository;
    private final SecurityAlertRepository securityAlertRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    public SecurityAnalyticsResponse getAnalyticsForUser(User user) {
        
        long totalLogins = loginActivityRepository.countByUser(user);
        long failedLogins = loginActivityRepository.countFailedAttempts(user);
        
        List<SuspiciousActivity> recentSuspicious = suspiciousActivityRepository.findTop20ByUserOrderByDetectedAtDesc(user);
        long suspiciousCount = recentSuspicious.size(); // Could do count but this is fine for now

        List<SecurityAlert> recentAlerts = securityAlertRepository.findTop20ByUserOrderByCreatedAtDesc(user);
        long alertsCount = recentAlerts.size(); 

        List<LoginActivity> recentLogins = loginActivityRepository.findTop10ByUserOrderByCreatedAtDesc(user);
        List<AuditLog> recentAudits = auditLogRepository.findTop50ByUserOrderByTimestampDesc(user);

        return SecurityAnalyticsResponse.builder()
                .totalLogins(totalLogins)
                .failedLogins(failedLogins)
                .suspiciousActivitiesCount(suspiciousCount)
                .securityAlertsCount(alertsCount)
                .recentLogins(recentLogins)
                .recentSuspiciousActivities(recentSuspicious)
                .recentAlerts(recentAlerts)
                .recentAuditLogs(recentAudits)
                .build();
    }
}
