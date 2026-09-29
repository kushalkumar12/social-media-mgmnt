package com.instamngmt.service;

import com.instamngmt.dto.AuthDTOs;
import com.instamngmt.entity.User;
import com.instamngmt.entity.UserPlan;
import com.instamngmt.exception.APIException;
import com.instamngmt.repository.UserRepository;
import com.instamngmt.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final SiteSettingService siteSettingService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider, SiteSettingService siteSettingService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.siteSettingService = siteSettingService;
    }

    @Transactional
    public AuthDTOs.AuthResponse registerDirect(AuthDTOs.DirectRegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new APIException(HttpStatus.BAD_REQUEST, "PASSWORD_MISMATCH", "Password and Confirm Password do not match");
        }

        userRepository.findByEmail(request.getEmail()).ifPresent(existingUser -> {
            if (Boolean.TRUE.equals(existingUser.getEmailVerified())) {
                throw new APIException(HttpStatus.BAD_REQUEST, "EMAIL_ALREADY_EXISTS", "Email address is already registered");
            }
        });

        boolean otpEnabled = siteSettingService.isRegistrationOtpEnabled();
        if (otpEnabled) {
            if (request.getOtpCode() == null || request.getOtpCode().isBlank()) {
                throw new APIException(HttpStatus.BAD_REQUEST, "OTP_REQUIRED", "OTP verification is enabled. Please request and enter your OTP.");
            }
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new APIException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Please send OTP first before verifying"));
            if (user.getOtpCode() == null || !user.getOtpCode().equals(request.getOtpCode())) {
                throw new APIException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Invalid OTP verification code");
            }
        }

        User user = userRepository.findByEmail(request.getEmail()).orElseGet(() -> User.builder()
                .email(request.getEmail())
                .build());

        user.setName(request.getName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");
        user.setPlan(UserPlan.SINGLE);
        user.setAccountLimit(UserPlan.SINGLE.getAccountLimit());
        user.setEmailVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiresAt(null);

        user = userRepository.save(user);

        String accessToken = tokenProvider.generateAccessToken(user.getEmail(), user.getId());
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail(), user.getId());

        return AuthDTOs.AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(mapToUserDTO(user))
                .build();
    }

    @Transactional
    public AuthDTOs.GenericResponse sendRegistrationOtp(AuthDTOs.RegisterSendOtpRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new APIException(HttpStatus.BAD_REQUEST, "PASSWORD_MISMATCH", "Password and Confirm Password do not match");
        }

        userRepository.findByEmail(request.getEmail()).ifPresent(existingUser -> {
            if (existingUser.getEmailVerified()) {
                throw new APIException(HttpStatus.BAD_REQUEST, "EMAIL_ALREADY_EXISTS", "Email address is already registered and verified");
            }
        });

        String otp = String.format("%06d", new Random().nextInt(900000) + 100000);
        LocalDateTime otpExpiresAt = LocalDateTime.now().plusMinutes(10);

        User user = userRepository.findByEmail(request.getEmail()).orElseGet(() -> User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .build());

        user.setName(request.getName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");
        user.setPlan(UserPlan.SINGLE);
        user.setAccountLimit(UserPlan.SINGLE.getAccountLimit());
        user.setEmailVerified(false);
        user.setOtpCode(otp);
        user.setOtpExpiresAt(otpExpiresAt);

        userRepository.save(user);

        log.info("REGISTRATION OTP generated for {}: {}", request.getEmail(), otp);

        return AuthDTOs.GenericResponse.builder()
                .success(true)
                .message("OTP sent to your email. Please enter the 6-digit code to complete registration.")
                .debugOtp(otp)
                .build();
    }

    @Transactional
    public AuthDTOs.AuthResponse verifyOtp(AuthDTOs.VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new APIException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Registration request not found for this email"));

        if (user.getOtpCode() == null || !user.getOtpCode().equals(request.getOtpCode())) {
            throw new APIException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Invalid OTP verification code");
        }

        if (user.getOtpExpiresAt() != null && user.getOtpExpiresAt().isBefore(LocalDateTime.now())) {
            throw new APIException(HttpStatus.BAD_REQUEST, "EXPIRED_OTP", "OTP verification code has expired. Please request a new one.");
        }

        user.setEmailVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiresAt(null);
        userRepository.save(user);

        String accessToken = tokenProvider.generateAccessToken(user.getEmail(), user.getId());
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail(), user.getId());

        return AuthDTOs.AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(mapToUserDTO(user))
                .build();
    }

    public AuthDTOs.AuthResponse login(AuthDTOs.LoginRequest request) {
        String input = request.getEmail();
        User user = userRepository.findByEmail(input)
                .or(() -> {
                    if ("admin".equalsIgnoreCase(input)) {
                        return userRepository.findByEmail("admin@instamngmt.com");
                    }
                    return java.util.Optional.empty();
                })
                .orElseThrow(() -> new APIException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email/username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new APIException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email/username or password");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new APIException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "Your email is not verified. Please verify your OTP code.");
        }

        String accessToken = tokenProvider.generateAccessToken(user.getEmail(), user.getId());
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail(), user.getId());

        return AuthDTOs.AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(mapToUserDTO(user))
                .build();
    }

    @Transactional
    public AuthDTOs.GenericResponse forgotPassword(AuthDTOs.ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new APIException(HttpStatus.NOT_FOUND, "EMAIL_NOT_FOUND", "No account registered with this email address"));

        String resetToken = UUID.randomUUID().toString();
        user.setResetToken(resetToken);
        user.setResetTokenExpiresAt(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        log.info("PASSWORD RESET LINK generated for {}: token={}", request.getEmail(), resetToken);

        return AuthDTOs.GenericResponse.builder()
                .success(true)
                .message("Password reset link sent to your email. Link is valid for 15 minutes.")
                .debugResetToken(resetToken)
                .build();
    }

    @Transactional
    public AuthDTOs.GenericResponse resetPassword(AuthDTOs.ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new APIException(HttpStatus.BAD_REQUEST, "PASSWORD_MISMATCH", "New Password and Confirm Password do not match");
        }

        User user = userRepository.findAll().stream()
                .filter(u -> request.getResetToken().equals(u.getResetToken()))
                .findFirst()
                .orElseThrow(() -> new APIException(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN", "Invalid or expired password reset link"));

        if (user.getResetTokenExpiresAt() != null && user.getResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new APIException(HttpStatus.BAD_REQUEST, "EXPIRED_RESET_TOKEN", "Password reset link has expired");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiresAt(null);
        userRepository.save(user);

        return AuthDTOs.GenericResponse.builder()
                .success(true)
                .message("Password has been reset successfully. You can now log in.")
                .build();
    }

    @Transactional
    public AuthDTOs.UserDTO upgradePlan(User user, UserPlan plan) {
        user.setPlan(plan);
        user.setAccountLimit(plan.getAccountLimit());
        user = userRepository.save(user);
        return mapToUserDTO(user);
    }

    public AuthDTOs.UserDTO getCurrentUserDTO() {
        return mapToUserDTO(getCurrentUser());
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new APIException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "User is not authenticated");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new APIException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "User not found"));
    }

    public AuthDTOs.UserDTO mapToUserDTO(User user) {
        return AuthDTOs.UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .plan(user.getPlan())
                .accountLimit(user.getAccountLimit())
                .trialExpiresAt(user.getTrialExpiresAt())
                .emailVerified(user.getEmailVerified())
                .build();
    }
}
