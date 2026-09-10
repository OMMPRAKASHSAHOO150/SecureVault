package com.example.auth.service;

import com.example.auth.dto.LoginActivityReportDTO;
import com.example.auth.dto.PasswordHealthReportDTO;

public interface ReportService {
    PasswordHealthReportDTO getPasswordHealthReport();
    LoginActivityReportDTO getLoginActivityReport();
}
