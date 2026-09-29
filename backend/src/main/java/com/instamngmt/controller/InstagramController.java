package com.instamngmt.controller;

import com.instamngmt.dto.InstagramDTOs;
import com.instamngmt.entity.User;
import com.instamngmt.service.AuthService;
import com.instamngmt.service.InstagramAuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/instagram")
public class InstagramController {

    private final InstagramAuthService instagramAuthService;
    private final AuthService authService;

    public InstagramController(InstagramAuthService instagramAuthService, AuthService authService) {
        this.instagramAuthService = instagramAuthService;
        this.authService = authService;
    }

    @PostMapping("/connect")
    public ResponseEntity<InstagramDTOs.InstagramAccountDTO> connectAccount(@Valid @RequestBody InstagramDTOs.AccountConnectRequest request) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(instagramAuthService.connectAccount(currentUser, request));
    }

    @PostMapping("/verify-details")
    public ResponseEntity<InstagramDTOs.VerifyAccountDetailsResponse> verifyAccountDetails(@Valid @RequestBody InstagramDTOs.VerifyAccountDetailsRequest request) {
        return ResponseEntity.ok(instagramAuthService.verifyAccountDetails(request));
    }

    @GetMapping("/accounts")
    public ResponseEntity<List<InstagramDTOs.InstagramAccountDTO>> getAccounts() {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(instagramAuthService.getUserAccounts(currentUser));
    }

    @GetMapping("/accounts/{id}")
    public ResponseEntity<InstagramDTOs.InstagramAccountDTO> getAccountById(@PathVariable Long id) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(instagramAuthService.getAccountById(currentUser, id));
    }

    @DeleteMapping("/accounts/{id}")
    public ResponseEntity<Void> disconnectAccount(@PathVariable Long id) {
        User currentUser = authService.getCurrentUser();
        instagramAuthService.disconnectAccount(currentUser, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/accounts/{id}/refresh")
    public ResponseEntity<InstagramDTOs.InstagramAccountDTO> refreshToken(@PathVariable Long id) {
        return ResponseEntity.ok(instagramAuthService.refreshAccountToken(id));
    }

    @PutMapping("/accounts/{id}/token")
    public ResponseEntity<InstagramDTOs.InstagramAccountDTO> updateToken(
            @PathVariable Long id,
            @Valid @RequestBody InstagramDTOs.UpdateTokenRequest request) {
        return ResponseEntity.ok(instagramAuthService.updateAccountToken(id, request.getAccessToken()));
    }
}
