package com.example.auth.serviceImpl;

import com.example.auth.dto.*;
import com.example.auth.entity.RefreshToken;
import com.example.auth.entity.PasswordResetToken;
import com.example.auth.entity.User;
import com.example.auth.entity.VerificationToken;
import com.example.auth.exception.AppExceptions.*;
import com.example.auth.repository.RefreshTokenRepository;
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
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
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
            throw new IllegalArgumentException("Password is not strong enough. It must contain at least 8 characters, " +
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
                .username(request.getUsername() != null && !request.getUsername().isBlank() ? request.getUsername() : null)
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
                .orElseThrow(() -> new IllegalArgumentException("No registered user found with email: " + email));

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
    public AuthResponseDTO login(LoginRequestDTO request) {
        // Find user first to check if they are verified
        String lookup = request.getEmailOrUsername();
        User user = userRepository.findByEmailIgnoreCase(lookup)
                .or(() -> userRepository.findByUsernameIgnoreCase(lookup))
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email/username or password"));

        if (!user.isEmailVerified()) {
            throw new AccountNotVerifiedException("Your email address is not verified yet. Please verify to sign in.");
        }

        try {
            // Trigger Spring Security authentication
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            String.valueOf(user.getId()), // Authenticaton manager loads user by ID string
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            throw new InvalidCredentialsException("Invalid email/username or password");
        } catch (DisabledException e) {
            throw new AccountNotVerifiedException("Your email address is not verified yet. Please verify to sign in.");
        }

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
    public AuthResponseDTO refreshToken(String refreshTokenStr) {
        RefreshToken token = refreshTokenRepository.findByToken(refreshTokenStr)
                .orElseThrow(() -> new TokenException("Invalid refresh token. Please sign in again."));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(token);
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

        refreshTokenRepository.delete(token);
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
                .orElseThrow(() -> new IllegalArgumentException("No registered user found with email: " + email));

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
                .orElseThrow(() -> new IllegalArgumentException("No registered user found with email: " + email));

        PasswordResetToken token = passwordResetTokenRepository.findByUser(user)
                .orElseThrow(() -> new TokenException("Invalid or expired OTP"));

        if (token.isConsumed() || token.getExpiryDate().isBefore(LocalDateTime.now()) || !token.getOtp().equals(otp)) {
            throw new TokenException("Invalid or expired OTP");
        }
    }

    @Override
    public void resetPassword(String email, String otp, String newPassword) {
        verifyPasswordResetOtp(email, otp);

        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new IllegalArgumentException("No registered user found with email: " + email));

        if (!PasswordValidator.isValid(newPassword)) {
            throw new IllegalArgumentException("Password is not strong enough. It must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters.");
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
}
