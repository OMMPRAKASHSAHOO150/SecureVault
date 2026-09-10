package com.example.auth.serviceImpl;

import com.example.auth.dto.*;
import com.example.auth.entity.RefreshToken;
import com.example.auth.entity.LoginActivity;
import com.example.auth.entity.SecurityAlert;
import com.example.auth.entity.SuspiciousActivity;
import com.example.auth.entity.AuditLog;
import com.example.auth.entity.PasswordResetToken;
import com.example.auth.entity.User;
import com.example.auth.entity.VerificationToken;
import com.example.auth.exception.AppExceptions.*;
import com.example.auth.repository.RefreshTokenRepository;
import com.example.auth.repository.LoginActivityRepository;
import com.example.auth.repository.SecurityAlertRepository;
import com.example.auth.repository.SuspiciousActivityRepository;
import com.example.auth.repository.AuditLogRepository;
import com.example.auth.repository.PasswordResetTokenRepository;
import com.example.auth.repository.UserRepository;
import com.example.auth.repository.VerificationTokenRepository;
import com.example.auth.security.JwtService;
import com.example.auth.service.AuthService;
import com.example.auth.service.EmailService;
import com.example.auth.validation.PasswordValidator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

        private final UserRepository userRepository;
        private final VerificationTokenRepository verificationTokenRepository;
        private final RefreshTokenRepository refreshTokenRepository;
        private final PasswordResetTokenRepository passwordResetTokenRepository;
        private final LoginActivityRepository loginActivityRepository;
        private final SuspiciousActivityRepository suspiciousActivityRepository;
        private final SecurityAlertRepository securityAlertRepository;
        private final AuditLogRepository auditLogRepository;
        private final PasswordEncoder passwordEncoder;
        private final AuthenticationManager authenticationManager;
        private final JwtService jwtService;
        private final EmailService emailService;

        @Value("${app.jwt.refresh-expiration-ms}")
        private long refreshExpirationMs;

        public AuthServiceImpl(
                        UserRepository userRepository,
                        VerificationTokenRepository verificationTokenRepository,
                        RefreshTokenRepository refreshTokenRepository,
                        PasswordResetTokenRepository passwordResetTokenRepository,
                        LoginActivityRepository loginActivityRepository,
                        SuspiciousActivityRepository suspiciousActivityRepository,
                        SecurityAlertRepository securityAlertRepository,
                        AuditLogRepository auditLogRepository,
                        PasswordEncoder passwordEncoder,
                        AuthenticationManager authenticationManager,
                        JwtService jwtService,
                        EmailService emailService) {
                this.userRepository = userRepository;
                this.verificationTokenRepository = verificationTokenRepository;
                this.refreshTokenRepository = refreshTokenRepository;
                this.passwordResetTokenRepository = passwordResetTokenRepository;
                this.loginActivityRepository = loginActivityRepository;
                this.suspiciousActivityRepository = suspiciousActivityRepository;
                this.securityAlertRepository = securityAlertRepository;
                this.auditLogRepository = auditLogRepository;
                this.passwordEncoder = passwordEncoder;
                this.authenticationManager = authenticationManager;
                this.jwtService = jwtService;
                this.emailService = emailService;
        }

        @Override
        public RegisterResponseDTO register(RegisterRequestDTO request) {
                // 1. Password Match Check
                if (!request.getPassword().equals(request.getConfirmPassword())) {
                        throw new IllegalArgumentException("Passwords do not match");
                }

                // 2. Password Strength Check
                if (!PasswordValidator.isValid(request.getPassword())) {
                        throw new IllegalArgumentException(
                                        "Password is not strong enough. It must contain at least 8 characters, " +
                                                        "including uppercase, lowercase, numbers, and special characters.");
                }

                // 3. Email Unique Check
                String normalizedEmail = normalizeEmail(request.getEmail());
                if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                        throw new UserAlreadyExistsException("An account with this email address already exists.");
                }

                // 4. Username Unique Check (if provided)
                if (request.getUsername() != null && !request.getUsername().isBlank()) {
                        if (userRepository.existsByUsername(request.getUsername())) {
                                throw new UserAlreadyExistsException("This username is already taken.");
                        }
                }

                // 5. Save User
                User user = User.builder()
                                .fullName(request.getFullName())
                                .email(normalizedEmail)
                                .username(request.getUsername() != null && !request.getUsername().isBlank()
                                                ? request.getUsername()
                                                : null)
                                .password(passwordEncoder.encode(request.getPassword()))
                                .role("USER")
                                .status("PENDING")
                                .emailVerified(false)
                                .build();

                User savedUser = userRepository.save(user);

                // 6. Generate Verification Token
                String token = UUID.randomUUID().toString();
                VerificationToken verificationToken = VerificationToken.builder()
                                .token(token)
                                .user(savedUser)
                                .expiryDate(LocalDateTime.now().plusHours(24))
                                .build();

                verificationTokenRepository.save(verificationToken);

                // 7. Send Verification Email
                emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getFullName(), token);

                return RegisterResponseDTO.builder()
                                .message("Registration Successful. Please verify your email.")
                                .userId(savedUser.getId())
                                .email(savedUser.getEmail())
                                .emailVerified(false)
                                .build();
        }

        @Override
        public void verifyEmail(String tokenStr) {
                VerificationToken token = verificationTokenRepository.findByToken(tokenStr)
                                .orElseThrow(() -> new TokenException("Invalid verification token"));

                if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
                        throw new TokenException("Verification token has expired");
                }

                User user = token.getUser();
                user.setEmailVerified(true);
                user.setStatus("ACTIVE");
                userRepository.save(user);

                // Remove the used token
                verificationTokenRepository.delete(token);
        }

        @Override
        public void resendVerificationEmail(String email) {
                User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "No registered user found with email: " + email));

                if (user.isEmailVerified()) {
                        throw new TokenException("This email address is already verified.");
                }

                // Clean up old verification token
                verificationTokenRepository.deleteByUser(user);

                // Generate new token
                String token = UUID.randomUUID().toString();
                VerificationToken verificationToken = VerificationToken.builder()
                                .token(token)
                                .user(user)
                                .expiryDate(LocalDateTime.now().plusHours(24))
                                .build();

                verificationTokenRepository.save(verificationToken);

                // Send email
                emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), token);
        }

        @Override
        @Transactional(noRollbackFor = InvalidCredentialsException.class)
        public AuthResponseDTO login(LoginRequestDTO request) {
                // Find user first to check if they are verified
                String lookup = request.getEmailOrUsername();
                User user = userRepository.findByEmailIgnoreCase(lookup)
                                .or(() -> userRepository.findByUsernameIgnoreCase(lookup))
                                .orElseThrow(() -> new InvalidCredentialsException(
                                                "Invalid email/username or password"));

                if (!user.isEmailVerified()) {
                        throw new AccountNotVerifiedException(
                                        "Your email address is not verified yet. Please verify to sign in.");
                }

                try {
                        // Trigger Spring Security authentication
                        Authentication auth = authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(
                                                        String.valueOf(user.getId()), // Authenticaton manager loads
                                                                                      // user by ID string
                                                        request.getPassword()));
                } catch (BadCredentialsException e) {
                        long attemptNumber = loginActivityRepository.countByUser(user) + 1;
                        user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
                        userRepository.save(user);
                        LoginActivity failedActivity = loginActivityRepository.save(LoginActivity.builder()
                                        .user(user)
                                        .email(user.getEmail())
                                        .status("FAILED")
                                        .attemptNumber((int) attemptNumber)
                                        .failureReason("INVALID_CREDENTIALS")
                                        .build());
                        detectSuspiciousActivity(user, failedActivity);
                        throw new InvalidCredentialsException("Invalid email/username or password");
                } catch (DisabledException e) {
                        throw new AccountNotVerifiedException(
                                        "Your email address is not verified yet. Please verify to sign in.");
                }

                user.setFailedLoginAttempts(0);
                userRepository.save(user);
                long attemptNumber = loginActivityRepository.countByUser(user) + 1;

                // Generate JWT access token
                String accessToken = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());

                // Generate Refresh Token
                String refreshTokenStr = UUID.randomUUID().toString();
                RefreshToken refreshToken = RefreshToken.builder()
                                .token(refreshTokenStr)
                                .user(user)
                                .expiryDate(LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000))
                                .build();

                // Clean up old refresh tokens for this user first
                refreshTokenRepository.deleteByUser(user);
                refreshTokenRepository.save(refreshToken);

                loginActivityRepository.save(LoginActivity.builder()
                                .user(user)
                                .email(user.getEmail())
                                .status("SUCCESS")
                                .attemptNumber((int) attemptNumber)
                                .build());

                UserSummaryDTO summary = UserSummaryDTO.builder()
                                .id(user.getId())
                                .name(user.getFullName())
                                .email(user.getEmail())
                                .role(user.getRole())
                                .build();

                return AuthResponseDTO.builder()
                                .accessToken(accessToken)
                                .refreshToken(refreshTokenStr)
                                .expiresIn(jwtService.getExpirationTime())
                                .user(summary)
                                .build();
        }

        @Override
        @Transactional(readOnly = true)
        public LoginActivityResponseDTO getLoginActivity() {
                User user = userRepository.findById(getCurrentUserId())
                                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));

                var activities = loginActivityRepository.findTop10ByUserOrderByCreatedAtDesc(user).stream()
                                .map(item -> LoginActivityDTO.builder()
                                                .status(item.getStatus())
                                                .attemptNumber(item.getAttemptNumber())
                                                .failureReason(item.getFailureReason())
                                                .ipAddress(item.getIpAddress())
                                                .createdAt(item.getCreatedAt())
                                                .build())
                                .toList();

                return LoginActivityResponseDTO.builder()
                                .totalAttempts(loginActivityRepository.countByUser(user))
                                .failedAttempts(loginActivityRepository.countFailedAttempts(user))
                                .successfulLogins(loginActivityRepository.countByUserAndStatus(user, "SUCCESS"))
                                .recentActivities(activities)
                                .build();
        }

        @Override
        @Transactional(readOnly = true)
        public SecurityOverviewResponseDTO getSecurityOverview() {
                User user = userRepository.findById(getCurrentUserId())
                                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));

                var alerts = securityAlertRepository.findTop20ByUserOrderByCreatedAtDesc(user).stream()
                                .map(item -> SecurityAlertDTO.builder()
                                                .id(item.getId())
                                                .alertType(item.getAlertType())
                                                .message(item.getMessage())
                                                .severity(item.getSeverity())
                                                .status(item.getStatus())
                                                .createdAt(item.getCreatedAt())
                                                .build())
                                .toList();

                var suspiciousActivities = suspiciousActivityRepository.findTop20ByUserOrderByDetectedAtDesc(user)
                                .stream()
                                .map(item -> SuspiciousActivityDTO.builder()
                                                .id(item.getId())
                                                .activityType(item.getActivityType())
                                                .description(item.getDescription())
                                                .failedAttempts(item.getFailedAttempts())
                                                .status(item.getStatus())
                                                .detectedAt(item.getDetectedAt())
                                                .build())
                                .toList();

                var auditLogs = auditLogRepository.findTop50ByUserOrderByTimestampDesc(user).stream()
                                .map(item -> AuditLogDTO.builder()
                                                .id(item.getId())
                                                .action(item.getAction())
                                                .description(item.getDescription())
                                                .timestamp(item.getTimestamp())
                                                .build())
                                .toList();

                return SecurityOverviewResponseDTO.builder()
                                .securityAlerts(alerts)
                                .suspiciousActivities(suspiciousActivities)
                                .auditLogs(auditLogs)
                                .build();
        }

        @Override
        public AuthResponseDTO refreshToken(String refreshTokenStr) {
                RefreshToken token = refreshTokenRepository.findByToken(refreshTokenStr)
                                .orElseThrow(() -> new TokenException("Invalid refresh token. Please sign in again."));

                if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
                        refreshTokenRepository.deleteByIdSafe(token.getId());
                        throw new TokenException("Refresh token has expired. Please sign in again.");
                }

                User user = token.getUser();
                // Generate new Access Token
                String accessToken = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());

                // Rotate Refresh Token
                String newRefreshTokenStr = UUID.randomUUID().toString();
                RefreshToken newRefreshToken = RefreshToken.builder()
                                .token(newRefreshTokenStr)
                                .user(user)
                                .expiryDate(LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000))
                                .build();

                refreshTokenRepository.deleteByIdSafe(token.getId());
                refreshTokenRepository.save(newRefreshToken);

                UserSummaryDTO summary = UserSummaryDTO.builder()
                                .id(user.getId())
                                .name(user.getFullName())
                                .email(user.getEmail())
                                .role(user.getRole())
                                .build();

                return AuthResponseDTO.builder()
                                .accessToken(accessToken)
                                .refreshToken(newRefreshTokenStr)
                                .expiresIn(jwtService.getExpirationTime())
                                .user(summary)
                                .build();
        }

        @Override
        public void logout(String refreshTokenStr) {
                refreshTokenRepository.deleteByToken(refreshTokenStr);
        }

        @Override
        public void requestPasswordReset(String email) {
                User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "No registered user found with email: " + email));

                String otp = String.format("%06d", (int) (Math.random() * 1_000_000));

                PasswordResetToken token = passwordResetTokenRepository.findByUser(user)
                                .orElseGet(PasswordResetToken::new);
                token.setOtp(otp);
                token.setUser(user);
                token.setExpiryDate(LocalDateTime.now().plusMinutes(10));
                token.setConsumed(false);

                passwordResetTokenRepository.save(token);
                emailService.sendPasswordResetOtpEmail(user.getEmail(), user.getFullName(), otp);
        }

        @Override
        public void verifyPasswordResetOtp(String email, String otp) {
                User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "No registered user found with email: " + email));

                PasswordResetToken token = passwordResetTokenRepository.findByUser(user)
                                .orElseThrow(() -> new TokenException("Invalid or expired OTP"));

                if (token.isConsumed() || token.getExpiryDate().isBefore(LocalDateTime.now())
                                || !token.getOtp().equals(otp)) {
                        throw new TokenException("Invalid or expired OTP");
                }
        }

        @Override
        public void resetPassword(String email, String otp, String newPassword) {
                verifyPasswordResetOtp(email, otp);

                User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "No registered user found with email: " + email));

                if (!PasswordValidator.isValid(newPassword)) {
                        throw new IllegalArgumentException(
                                        "Password is not strong enough. It must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters.");
                }

                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);

                passwordResetTokenRepository.findByUser(user).ifPresent(token -> {
                        token.setConsumed(true);
                        passwordResetTokenRepository.save(token);
                });
        }

        private String normalizeEmail(String email) {
                return email == null ? null : email.trim().toLowerCase();
        }

        private Long getCurrentUserId() {
                Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                                .getContext().getAuthentication();
                if (authentication == null || authentication.getName() == null) {
                        throw new IllegalStateException("Unauthenticated");
                }
                return Long.parseLong(authentication.getName());
        }

        //// detectSuspiciousActivity aftre gateing 5 times login faild////
        private void detectSuspiciousActivity(User user, LoginActivity failedActivity) {
                long failedAttempts = loginActivityRepository.countFailedAttempts(user);
                if (failedAttempts < 5) {
                        auditLogRepository.save(AuditLog.builder()
                                        .user(user)
                                        .action("LOGIN_FAILED")
                                        .description("Login failed for account " + user.getEmail())
                                        .build());
                        return;
                }
                ///////////////////////////////////////////

                boolean alreadyFlagged = !suspiciousActivityRepository
                                .findTop20ByUserOrderByDetectedAtDesc(user)
                                .stream()
                                .filter(item -> "OPEN".equalsIgnoreCase(item.getStatus()))
                                .toList()
                                .isEmpty();

                if (!alreadyFlagged) {
                        SuspiciousActivity suspiciousActivity = suspiciousActivityRepository.save(SuspiciousActivity
                                        .builder()
                                        .user(user)
                                        .activityType("MULTIPLE_FAILED_LOGIN_ATTEMPTS")
                                        .description("Detected " + failedAttempts + " failed login attempts for "
                                                        + user.getEmail())
                                        .failedAttempts((int) failedAttempts)
                                        .status("FLAGGED")
                                        .build());

                        SecurityAlert alert = securityAlertRepository.save(SecurityAlert.builder()
                                        .user(user)
                                        .alertType("MULTIPLE_FAILED_LOGIN_ATTEMPTS")
                                        .message("Multiple failed login attempts detected for " + user.getEmail())
                                        .severity("HIGH")
                                        .status("UNREAD")
                                        .build());

                        auditLogRepository.save(AuditLog.builder()
                                        .user(user)
                                        .action("SUSPICIOUS_ACTIVITY_DETECTED")
                                        .description("Suspicious activity flagged after " + failedAttempts
                                                        + " failed login attempts")
                                        .build());

                        auditLogRepository.save(AuditLog.builder()
                                        .user(user)
                                        .action("SECURITY_ALERT_CREATED")
                                        .description("Security alert created for suspicious activity #"
                                                        + suspiciousActivity.getId())
                                        .build());
                }

                auditLogRepository.save(AuditLog.builder()
                                .user(user)
                                .action("LOGIN_FAILED")
                                .description("Login failed for account " + user.getEmail())
                                .build());
        }
}
