package com.example.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordHealthReportDTO {
    private int totalCredentials;
    private int strongPasswords;
    private int mediumPasswords;
    private int weakPasswords;
    private int healthScore;
}
