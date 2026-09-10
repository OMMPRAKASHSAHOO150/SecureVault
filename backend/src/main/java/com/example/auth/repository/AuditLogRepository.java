package com.example.auth.repository;

import com.example.auth.entity.AuditLog;
import com.example.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop50ByUserOrderByTimestampDesc(User user);
}
