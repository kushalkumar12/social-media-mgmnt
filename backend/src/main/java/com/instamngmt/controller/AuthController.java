package com.instamngmt.controller;

import com.instamngmt.dto.AuthDTOs;
import com.instamngmt.entity.User;
import com.instamngmt.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDTOs.AuthResponse> registerDirect(@Valid @RequestBody AuthDTOs.DirectRegisterRequest request) {
        return ResponseEntity.ok(authService.registerDirect(request));
    }

    @PostMapping("/register-send-otp")
    public ResponseEntity<AuthDTOs.GenericResponse> registerSendOtp(@Valid @RequestBody AuthDTOs.RegisterSendOtpRequest request) {
        return ResponseEntity.ok(authService.sendRegistrationOtp(request));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthDTOs.AuthResponse> verifyOtp(@Valid @RequestBody AuthDTOs.VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.verifyOtp(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDTOs.AuthResponse> login(@Valid @RequestBody AuthDTOs.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<AuthDTOs.GenericResponse> forgotPassword(@Valid @RequestBody AuthDTOs.ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthDTOs.GenericResponse> resetPassword(@Valid @RequestBody AuthDTOs.ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @PostMapping("/upgrade-plan")
    public ResponseEntity<AuthDTOs.UserDTO> upgradePlan(@Valid @RequestBody AuthDTOs.UpgradePlanRequest request) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(authService.upgradePlan(currentUser, request.getPlan()));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDTOs.UserDTO> getCurrentUser() {
        return ResponseEntity.ok(authService.getCurrentUserDTO());
    }
}
