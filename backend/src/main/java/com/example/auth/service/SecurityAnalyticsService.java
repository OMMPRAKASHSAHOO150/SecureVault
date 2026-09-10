package com.example.auth.service;

import com.example.auth.dto.SecurityAnalyticsResponse;
import com.example.auth.entity.User;

public interface SecurityAnalyticsService {
    SecurityAnalyticsResponse getAnalyticsForUser(User user);
}
