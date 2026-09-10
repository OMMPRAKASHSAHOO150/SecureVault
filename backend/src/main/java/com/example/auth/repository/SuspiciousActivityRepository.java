package com.example.auth.repository;

import com.example.auth.entity.SuspiciousActivity;
import com.example.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SuspiciousActivityRepository extends JpaRepository<SuspiciousActivity, Long> {
    List<SuspiciousActivity> findTop20ByUserOrderByDetectedAtDesc(User user);
}
