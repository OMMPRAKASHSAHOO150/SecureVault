package com.example.auth.repository;

import com.example.auth.entity.LoginActivity;
import com.example.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

import org.springframework.data.repository.query.Param;

public interface LoginActivityRepository extends JpaRepository<LoginActivity, Long> {

    long countByUserAndStatus(User user, String status);
    long countByUser(User user);

    List<LoginActivity> findTop10ByUserOrderByCreatedAtDesc(User user);

    @Query("select count(l) from LoginActivity l where l.user = :user and l.status = 'FAILED'")
    long countFailedAttempts(@Param("user") User user);
}
