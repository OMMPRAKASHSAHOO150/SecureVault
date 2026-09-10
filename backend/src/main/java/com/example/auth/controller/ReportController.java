package com.example.auth.controller;

import com.example.auth.dto.LoginActivityReportDTO;
import com.example.auth.dto.PasswordHealthReportDTO;
import com.example.auth.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/password-health")
    public ResponseEntity<PasswordHealthReportDTO> getPasswordHealth() {
        return ResponseEntity.ok(reportService.getPasswordHealthReport());
    }

    @GetMapping("/login-activity")
    public ResponseEntity<LoginActivityReportDTO> getLoginActivity() {
        return ResponseEntity.ok(reportService.getLoginActivityReport());
    }
}
