package com.instamngmt.service;

import com.instamngmt.dto.InstagramDTOs;
import com.instamngmt.entity.AccountStatus;
import com.instamngmt.entity.InstagramAccount;
import com.instamngmt.entity.User;
import com.instamngmt.exception.APIException;
import com.instamngmt.exception.ResourceNotFoundException;
import com.instamngmt.repository.InstagramAccountRepository;
import com.instamngmt.util.EncryptionUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InstagramAuthService {

    private final InstagramAccountRepository instagramAccountRepository;
    private final InstagramClientService instagramClientService;
    private final EncryptionUtil encryptionUtil;

    public InstagramAuthService(
            InstagramAccountRepository instagramAccountRepository,
            InstagramClientService instagramClientService,
            EncryptionUtil encryptionUtil) {
        this.instagramAccountRepository = instagramAccountRepository;
        this.instagramClientService = instagramClientService;
        this.encryptionUtil = encryptionUtil;
    }

    public InstagramDTOs.VerifyAccountDetailsResponse verifyAccountDetails(InstagramDTOs.VerifyAccountDetailsRequest request) {
        String userId = request.getUserId() != null ? request.getUserId().trim() : "";
        String accessToken = request.getAccessToken() != null ? request.getAccessToken().trim() : "";

        if (userId.isBlank() || accessToken.isBlank()) {
            throw new APIException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "User ID and Access Token are required");
        }

        InstagramClientService.DetailedAccountInfo info = instagramClientService.fetchAccountDetails(userId, accessToken);

        return InstagramDTOs.VerifyAccountDetailsResponse.builder()
                .userId(info.igUserId())
                .accessToken(accessToken)
                .username(info.username())
                .profilePictureUrl(info.profilePictureUrl())
                .followersCount(info.followersCount())
                .followingCount(info.followingCount())
                .valid(info.valid())
                .message("Instagram Account verified successfully via Graph API!")
                .build();
    }

    @Transactional
    public InstagramDTOs.InstagramAccountDTO connectAccount(User user, InstagramDTOs.AccountConnectRequest request) {
        String token = request.getCode();
        if (token == null || token.isBlank()) {
            throw new APIException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN", "Valid Instagram access token is required.");
        }

        String resolvedUserId = (request.getUserId() != null && !request.getUserId().isBlank()) ? request.getUserId().trim() : "";
        String resolvedUsername = (request.getUsername() != null && !request.getUsername().isBlank()) ? request.getUsername().trim() : "";
        String resolvedAccountType = "BUSINESS";

        if (resolvedUserId.isBlank() || resolvedUsername.isBlank()) {
            InstagramClientService.AccountInfo info = instagramClientService.getAccountInfo(token);
            if (resolvedUserId.isBlank()) resolvedUserId = info.igUserId();
            if (resolvedUsername.isBlank()) resolvedUsername = info.username();
            if (info.accountType() != null && !info.accountType().isBlank()) resolvedAccountType = info.accountType();
        }

        final String targetUserId = resolvedUserId;
        final String targetUsername = resolvedUsername;
        final String accountType = resolvedAccountType;

        List<InstagramAccount> existingUserAccounts = instagramAccountRepository.findByUserId(user.getId());
        boolean isNewAccount = existingUserAccounts.stream().noneMatch(a -> a.getIgUserId().equals(targetUserId));

        if (isNewAccount && existingUserAccounts.size() >= user.getAccountLimit()) {
            throw new APIException(HttpStatus.BAD_REQUEST, "ACCOUNT_LIMIT_EXCEEDED",
                    String.format("Your current %s plan allows up to %d connected Instagram accounts. Please upgrade your subscription plan to connect more accounts.",
                            user.getPlan().name(), user.getAccountLimit()));
        }

        InstagramAccount account = instagramAccountRepository.findByIgUserId(targetUserId)
                .orElseGet(() -> InstagramAccount.builder()
                        .user(user)
                        .igUserId(targetUserId)
                        .username(targetUsername)
                        .build());

        account.setUser(user);
        account.setUsername(targetUsername);
        account.setIgUserId(targetUserId);
        account.setAccountType(accountType);
        account.setFacebookPageId(request.getFacebookPageId() != null ? request.getFacebookPageId() : "page_" + targetUserId);
        account.setAccessTokenEncrypted(encryptionUtil.encrypt(token));
        account.setTokenExpiresAt(LocalDateTime.now().plusDays(60)); // Long-lived token 60 days
        account.setLastRefreshedAt(LocalDateTime.now());
        account.setScopesGranted("instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement");
        account.setStatus(AccountStatus.ACTIVE);

        if (request.getFollowersCount() != null) account.setFollowersCount(request.getFollowersCount());
        if (request.getFollowingCount() != null) account.setFollowingCount(request.getFollowingCount());
        if (request.getProfilePictureUrl() != null && !request.getProfilePictureUrl().isBlank()) {
            account.setProfilePictureUrl(request.getProfilePictureUrl());
        } else {
            try {
                InstagramClientService.DetailedAccountInfo detailedInfo = instagramClientService.fetchAccountDetails(targetUserId, token);
                if (detailedInfo.profilePictureUrl() != null) {
                    account.setProfilePictureUrl(detailedInfo.profilePictureUrl());
                }
            } catch (Exception ignored) {}
        }

        account = instagramAccountRepository.save(account);
        return mapToDTO(account);
    }

    public List<InstagramDTOs.InstagramAccountDTO> getUserAccounts(User user) {
        return instagramAccountRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public InstagramDTOs.InstagramAccountDTO getAccountById(User user, Long accountId) {
        InstagramAccount account = instagramAccountRepository.findByIdAndUserId(accountId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("InstagramAccount", "id", accountId));
        return mapToDTO(account);
    }

    @Transactional
    public void disconnectAccount(User user, Long accountId) {
        InstagramAccount account = instagramAccountRepository.findByIdAndUserId(accountId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("InstagramAccount", "id", accountId));
        instagramAccountRepository.delete(account);
    }

    @Transactional
    public InstagramDTOs.InstagramAccountDTO refreshAccountToken(Long accountId) {
        InstagramAccount account = instagramAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("InstagramAccount", "id", accountId));

        String currentToken = encryptionUtil.decrypt(account.getAccessTokenEncrypted());

        try {
            // Live verification with Meta Graph API
            InstagramClientService.DetailedAccountInfo info = instagramClientService.fetchAccountDetails(account.getIgUserId(), currentToken);

            if (info.username() != null && !info.username().isBlank()) {
                account.setUsername(info.username());
            }
            if (info.profilePictureUrl() != null && !info.profilePictureUrl().isBlank()) {
                account.setProfilePictureUrl(info.profilePictureUrl());
            }
            account.setFollowersCount(info.followersCount());
            account.setFollowingCount(info.followingCount());
            account.setLastRefreshedAt(LocalDateTime.now());
            account.setStatus(AccountStatus.ACTIVE);

            // Attempt extending long-lived token if configured
            try {
                String newToken = instagramClientService.refreshLongLivedToken(currentToken);
                if (newToken != null && !newToken.isBlank()) {
                    account.setAccessTokenEncrypted(encryptionUtil.encrypt(newToken));
                    account.setTokenExpiresAt(LocalDateTime.now().plusDays(60));
                }
            } catch (Exception ignored) {}

            account = instagramAccountRepository.save(account);
            return mapToDTO(account);
        } catch (Exception e) {
            account.setStatus(AccountStatus.TOKEN_EXPIRED);
            account.setLastRefreshedAt(LocalDateTime.now());
            instagramAccountRepository.save(account);
            throw new APIException(HttpStatus.BAD_REQUEST, "TOKEN_REFRESH_FAILED",
                    "Meta token verification failed: " + e.getMessage());
        }
    }

    @Transactional
    public InstagramDTOs.InstagramAccountDTO updateAccountToken(Long accountId, String newAccessToken) {
        InstagramAccount account = instagramAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("InstagramAccount", "id", accountId));

        if (newAccessToken == null || newAccessToken.isBlank()) {
            throw new APIException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN", "Access token is required.");
        }

        String cleanToken = newAccessToken.trim();
        InstagramClientService.DetailedAccountInfo info = instagramClientService.fetchAccountDetails(account.getIgUserId(), cleanToken);

        account.setAccessTokenEncrypted(encryptionUtil.encrypt(cleanToken));
        if (info.username() != null && !info.username().isBlank()) {
            account.setUsername(info.username());
        }
        if (info.profilePictureUrl() != null && !info.profilePictureUrl().isBlank()) {
            account.setProfilePictureUrl(info.profilePictureUrl());
        }
        account.setFollowersCount(info.followersCount());
        account.setFollowingCount(info.followingCount());
        account.setTokenExpiresAt(LocalDateTime.now().plusDays(60));
        account.setLastRefreshedAt(LocalDateTime.now());
        account.setStatus(AccountStatus.ACTIVE);

        account = instagramAccountRepository.save(account);
        return mapToDTO(account);
    }

    @Transactional
    public void handleDeauthorizeWebhook(String igUserId) {
        instagramAccountRepository.findByIgUserId(igUserId).ifPresent(account -> {
            account.setStatus(AccountStatus.DEAUTHORIZED);
            instagramAccountRepository.save(account);
        });
    }

    public InstagramDTOs.InstagramAccountDTO mapToDTO(InstagramAccount account) {
        List<String> scopes = account.getScopesGranted() != null
                ? Arrays.asList(account.getScopesGranted().split(","))
                : List.of();

        return InstagramDTOs.InstagramAccountDTO.builder()
                .id(account.getId())
                .facebookPageId(account.getFacebookPageId())
                .igUserId(account.getIgUserId())
                .username(account.getUsername())
                .profilePictureUrl(account.getProfilePictureUrl())
                .followersCount(account.getFollowersCount())
                .followingCount(account.getFollowingCount())
                .accountType(account.getAccountType())
                .status(account.getStatus())
                .tokenExpiresAt(account.getTokenExpiresAt())
                .lastRefreshedAt(account.getLastRefreshedAt())
                .connectedAt(account.getConnectedAt())
                .scopesGranted(scopes)
                .build();
    }
}
