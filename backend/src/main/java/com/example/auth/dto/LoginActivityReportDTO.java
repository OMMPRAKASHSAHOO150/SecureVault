package com.example.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginActivityReportDTO {
    private int totalAttempts;
    private int successfulLogins;
    private int failedLogins;
}
