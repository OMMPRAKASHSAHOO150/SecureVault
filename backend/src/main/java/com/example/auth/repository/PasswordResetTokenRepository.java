package com.example.auth.repository;

import com.example.auth.entity.PasswordResetToken;
import com.example.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByOtp(String otp);
    Optional<PasswordResetToken> findByUser(User user);
    void deleteByUser(User user);
}
