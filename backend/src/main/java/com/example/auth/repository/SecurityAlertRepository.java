package com.example.auth.repository;

import com.example.auth.entity.SecurityAlert;
import com.example.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SecurityAlertRepository extends JpaRepository<SecurityAlert, Long> {
    List<SecurityAlert> findTop20ByUserOrderByCreatedAtDesc(User user);
}
