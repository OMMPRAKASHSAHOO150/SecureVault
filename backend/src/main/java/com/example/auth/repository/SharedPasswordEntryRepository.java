package com.example.auth.repository;

import com.example.auth.entity.PasswordEntry;
import com.example.auth.entity.SharedPasswordEntry;
import com.example.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SharedPasswordEntryRepository extends JpaRepository<SharedPasswordEntry, Long> {
    List<SharedPasswordEntry> findAllByRecipientUserOrderByUpdatedAtDesc(User recipientUser);
    List<SharedPasswordEntry> findAllByRecipientEmailOrderByUpdatedAtDesc(String recipientEmail);
    List<SharedPasswordEntry> findAllByOwnerUserAndPasswordEntry(User ownerUser, PasswordEntry passwordEntry);
    Optional<SharedPasswordEntry> findByPasswordEntryAndRecipientUser(PasswordEntry passwordEntry, User recipientUser);
    Optional<SharedPasswordEntry> findByPasswordEntryAndRecipientEmail(PasswordEntry passwordEntry, String recipientEmail);
}
