package com.example.auth.serviceImpl;

import com.example.auth.dto.LoginActivityReportDTO;
import com.example.auth.dto.PasswordHealthReportDTO;
import com.example.auth.entity.LoginActivity;
import com.example.auth.entity.PasswordEntry;
import com.example.auth.entity.User;
import com.example.auth.repository.LoginActivityRepository;
import com.example.auth.repository.PasswordEntryRepository;
import com.example.auth.repository.UserRepository;
import com.example.auth.service.ReportService;
import com.example.auth.validation.PasswordValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final PasswordEntryRepository passwordEntryRepository;
    private final LoginActivityRepository loginActivityRepository;
    private final UserRepository userRepository;
    private final PasswordVaultServiceImpl passwordVaultService;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Unauthorized");
        }
        Long userId = Long.parseLong(authentication.getName());
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    @Override
    public PasswordHealthReportDTO getPasswordHealthReport() {
        User user = getCurrentUser();
        List<PasswordEntry> entries = passwordEntryRepository.findAllByUserOrderByUpdatedAtDesc(user);
        
        int total = entries.size();
        int strong = 0;
        int medium = 0;
        int weak = 0;
        
        for (PasswordEntry entry : entries) {
            String plainPassword = passwordVaultService.decrypt(entry.getEncryptedPassword());
            if (PasswordValidator.isValid(plainPassword)) {
                strong++;
            } else if (plainPassword != null && plainPassword.length() >= 8) {
                medium++;
            } else {
                weak++;
            }
        }
        
        int healthScore = 0;
        if (total > 0) {
            healthScore = (int) Math.round(((strong * 1.0) + (medium * 0.5)) / total * 100);
        }

        return PasswordHealthReportDTO.builder()
                .totalCredentials(total)
                .strongPasswords(strong)
                .mediumPasswords(medium)
                .weakPasswords(weak)
                .healthScore(healthScore)
                .build();
    }

    @Override
    public LoginActivityReportDTO getLoginActivityReport() {
        User user = getCurrentUser();
        List<LoginActivity> logs = loginActivityRepository.findAll(); 
        // Note: I will filter for the current user in memory since we aren't guaranteed findAllByUser exists
        
        int total = 0;
        int success = 0;
        int failed = 0;
        
        for (LoginActivity log : logs) {
            if (log.getUser().getId().equals(user.getId())) {
                total++;
                if ("SUCCESS".equalsIgnoreCase(log.getStatus())) {
                    success++;
                } else {
                    failed++;
                }
            }
        }
        
        return LoginActivityReportDTO.builder()
                .totalAttempts(total)
                .successfulLogins(success)
                .failedLogins(failed)
                .build();
    }
}
