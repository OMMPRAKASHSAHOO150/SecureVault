package com.example.auth.serviceImpl;

import com.example.auth.dto.PasswordEntryRequestDTO;
import com.example.auth.dto.PasswordEntryResponseDTO;
import com.example.auth.dto.SharePasswordEntryRequestDTO;
import com.example.auth.dto.SharedPasswordEntryResponseDTO;
import com.example.auth.entity.PasswordEntry;
import com.example.auth.entity.SharedPasswordEntry;
import com.example.auth.entity.User;
import com.example.auth.repository.PasswordEntryRepository;
import com.example.auth.repository.SharedPasswordEntryRepository;
import com.example.auth.repository.UserRepository;
import com.example.auth.service.PasswordVaultService;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

@Service
@Transactional
public class PasswordVaultServiceImpl implements PasswordVaultService {

    private static final String AES = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH = 128;

    private final PasswordEntryRepository passwordEntryRepository;
    private final SharedPasswordEntryRepository sharedPasswordEntryRepository;
    private final UserRepository userRepository;
    private final SecretKeySpec secretKeySpec;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordVaultServiceImpl(
            PasswordEntryRepository passwordEntryRepository,
            SharedPasswordEntryRepository sharedPasswordEntryRepository,
            UserRepository userRepository,
            @Value("${app.vault.secret:${app.jwt.secret}}") String vaultSecret
    ) throws Exception {
        this.passwordEntryRepository = passwordEntryRepository;
        this.sharedPasswordEntryRepository = sharedPasswordEntryRepository;
        this.userRepository = userRepository;
        this.secretKeySpec = new SecretKeySpec(deriveKey(vaultSecret), AES);
    }

    @Override
    public List<PasswordEntryResponseDTO> getEntriesForCurrentUser() {
        User user = getCurrentUser();
        return passwordEntryRepository.findAllByUserOrderByUpdatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<PasswordEntryResponseDTO> getSharedEntriesForCurrentUser() {
        User user = getCurrentUser();
        List<SharedPasswordEntry> byUser = sharedPasswordEntryRepository.findAllByRecipientUserOrderByUpdatedAtDesc(user);
        List<SharedPasswordEntry> byEmail = sharedPasswordEntryRepository.findAllByRecipientEmailOrderByUpdatedAtDesc(normalizeEmail(user.getEmail()));
        return java.util.stream.Stream.concat(byUser.stream(), byEmail.stream())
                .distinct()
                .map(shared -> toResponse(shared.getPasswordEntry()))
                .toList();
    }

    @Override
    public PasswordEntryResponseDTO createEntry(PasswordEntryRequestDTO request) {
        User user = getCurrentUser();
        PasswordEntry entry = PasswordEntry.builder()
                .user(user)
                .title(request.getTitle())
                .loginName(request.getLoginName())
                .websiteUrl(blankToNull(request.getWebsiteUrl()))
                .encryptedPassword(encrypt(request.getPassword()))
                .notes(blankToNull(request.getNotes()))
                .build();
        return toResponse(passwordEntryRepository.save(entry));
    }

    @Override
    public PasswordEntryResponseDTO updateEntry(Long id, PasswordEntryRequestDTO request) {
        PasswordEntry entry = getAccessibleEntry(id, true);
        entry.setTitle(request.getTitle());
        entry.setLoginName(request.getLoginName());
        entry.setWebsiteUrl(blankToNull(request.getWebsiteUrl()));
        entry.setEncryptedPassword(encrypt(request.getPassword()));
        entry.setNotes(blankToNull(request.getNotes()));
        return toResponse(passwordEntryRepository.save(entry));
    }

    @Override
    public void deleteEntry(Long id) {
        PasswordEntry entry = getAccessibleEntry(id, true);
        if (!canManageFull(entry)) {
            throw new IllegalArgumentException("You do not have permission to delete this credential");
        }
        passwordEntryRepository.delete(entry);
    }

    @Override
    public SharedPasswordEntryResponseDTO shareEntry(SharePasswordEntryRequestDTO request) {
        User owner = getCurrentUser();
        PasswordEntry entry = getOwnedEntry(request.getPasswordEntryId());
        User recipient = resolveRecipient(request);
        String recipientEmail = normalizeEmail(request.getRecipientEmail());
        if (recipientEmail == null && recipient != null) {
            recipientEmail = normalizeEmail(recipient.getEmail());
        }
        if (recipient == null && recipientEmail == null) {
            throw new IllegalArgumentException("Recipient user is required");
        }

        String permission = normalizePermission(request.getPermission());
        SharedPasswordEntry share = findExistingShare(entry, recipient, recipientEmail)
                .orElseGet(SharedPasswordEntry::new);
        share.setPasswordEntry(entry);
        share.setOwnerUser(owner);
        share.setRecipientUser(recipient);
        share.setRecipientEmail(recipientEmail);
        share.setPermission(permission);
        share.setAccepted(recipient != null);

        SharedPasswordEntry saved = sharedPasswordEntryRepository.save(share);
        return SharedPasswordEntryResponseDTO.builder()
                .id(saved.getId())
                .passwordEntryId(saved.getPasswordEntry().getId())
                .ownerUserId(saved.getOwnerUser().getId())
                .recipientUserId(saved.getRecipientUser() != null ? saved.getRecipientUser().getId() : null)
                .permission(saved.getPermission())
                .password(decrypt(saved.getPasswordEntry().getEncryptedPassword()))
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Override
    public void revokeShare(Long shareId) {
        SharedPasswordEntry share = sharedPasswordEntryRepository.findById(shareId)
                .orElseThrow(() -> new IllegalArgumentException("Share not found"));
        if (!share.getOwnerUser().getId().equals(getCurrentUser().getId())) {
            throw new IllegalArgumentException("Share not found");
        }
        sharedPasswordEntryRepository.delete(share);
    }

    private PasswordEntry getOwnedEntry(Long id) {
        User user = getCurrentUser();
        PasswordEntry entry = passwordEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Password entry not found"));
        if (!entry.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Password entry not found");
        }
        return entry;
    }

    private PasswordEntry getAccessibleEntry(Long id, boolean requireWrite) {
        User user = getCurrentUser();
        PasswordEntry entry = passwordEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Password entry not found"));
        if (entry.getUser().getId().equals(user.getId())) {
            return entry;
        }
        SharedPasswordEntry share = sharedPasswordEntryRepository.findByPasswordEntryAndRecipientUser(entry, user)
                .or(() -> sharedPasswordEntryRepository.findByPasswordEntryAndRecipientEmail(entry, normalizeEmail(user.getEmail())))
                .orElseThrow(() -> new IllegalArgumentException("Password entry not found"));
        String permission = normalizePermission(share.getPermission());
        if (requireWrite && "VIEW_ONLY".equals(permission)) {
            throw new IllegalArgumentException("You do not have permission to modify this credential");
        }
        return entry;
    }

    private boolean canManageFull(PasswordEntry entry) {
        User user = getCurrentUser();
        if (entry.getUser().getId().equals(user.getId())) {
            return true;
        }
        SharedPasswordEntry share = sharedPasswordEntryRepository.findByPasswordEntryAndRecipientUser(entry, user)
                .or(() -> sharedPasswordEntryRepository.findByPasswordEntryAndRecipientEmail(entry, normalizeEmail(user.getEmail())))
                .orElseThrow(() -> new IllegalArgumentException("Password entry not found"));
        return "FULL_MANAGEMENT".equals(normalizePermission(share.getPermission()));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Unauthorized");
        }
        Long userId = Long.parseLong(authentication.getName());
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }

    private PasswordEntryResponseDTO toResponse(PasswordEntry entry) {
        return PasswordEntryResponseDTO.builder()
                .id(entry.getId())
                .title(entry.getTitle())
                .loginName(entry.getLoginName())
                .websiteUrl(entry.getWebsiteUrl())
                .password(decrypt(entry.getEncryptedPassword()))
                .notes(entry.getNotes())
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }

    private String encrypt(String plainText) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, new GCMParameterSpec(TAG_LENGTH, iv));
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            ByteBuffer buffer = ByteBuffer.allocate(iv.length + encrypted.length);
            buffer.put(iv);
            buffer.put(encrypted);
            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt password", e);
        }
    }

    private String decrypt(String encoded) {
        try {
            byte[] allBytes = Base64.getDecoder().decode(encoded);
            ByteBuffer buffer = ByteBuffer.wrap(allBytes);
            byte[] iv = new byte[IV_LENGTH];
            buffer.get(iv);
            byte[] encrypted = new byte[buffer.remaining()];
            buffer.get(encrypted);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, new GCMParameterSpec(TAG_LENGTH, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt password", e);
        }
    }

    private byte[] deriveKey(String secret) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return digest.digest(secret.getBytes(StandardCharsets.UTF_8));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizePermission(String permission) {
        if (permission == null) {
            throw new IllegalArgumentException("Permission is required");
        }
        String normalized = permission.trim().toUpperCase();
        if (!normalized.equals("VIEW_ONLY") && !normalized.equals("EDIT_ACCESS") && !normalized.equals("FULL_MANAGEMENT")) {
            throw new IllegalArgumentException("Invalid permission level");
        }
        return normalized;
    }

    private User resolveRecipient(SharePasswordEntryRequestDTO request) {
        if (request.getRecipientUserId() != null) {
            return userRepository.findById(request.getRecipientUserId())
                    .orElseThrow(() -> new IllegalArgumentException("Recipient user not found"));
        }
        String recipientEmail = normalizeEmail(request.getRecipientEmail());
        if (recipientEmail != null) {
            return userRepository.findByEmailIgnoreCase(recipientEmail)
                    .orElse(null);
        }
        return null;
    }

    private java.util.Optional<SharedPasswordEntry> findExistingShare(PasswordEntry entry, User recipient, String recipientEmail) {
        if (recipient != null) {
            return sharedPasswordEntryRepository.findByPasswordEntryAndRecipientUser(entry, recipient)
                    .or(() -> recipientEmail == null ? java.util.Optional.empty() : sharedPasswordEntryRepository.findByPasswordEntryAndRecipientEmail(entry, recipientEmail));
        }
        return recipientEmail == null ? java.util.Optional.empty() : sharedPasswordEntryRepository.findByPasswordEntryAndRecipientEmail(entry, recipientEmail);
    }

    private String normalizeEmail(String email) {
        return email == null || email.isBlank() ? null : email.trim().toLowerCase();
    }
}
