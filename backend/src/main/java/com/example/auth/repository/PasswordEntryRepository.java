package com.example.auth.repository;

import com.example.auth.entity.PasswordEntry;
import com.example.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PasswordEntryRepository extends JpaRepository<PasswordEntry, Long> {
    List<PasswordEntry> findAllByUserOrderByUpdatedAtDesc(User user);
    long countByUser(User user);
}
