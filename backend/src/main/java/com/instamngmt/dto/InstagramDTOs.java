package com.instamngmt.dto;

import com.instamngmt.entity.AccountStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class InstagramDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AccountConnectRequest {
        @NotBlank(message = "Authorization code or access token is required")
        private String code;
        private String redirectUri;
        private String facebookPageId;
        private String userId;
        private String username;
        private String profilePictureUrl;
        private Integer followersCount;
        private Integer followingCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerifyAccountDetailsRequest {
        @NotBlank(message = "User ID is required")
        private String userId;
        @NotBlank(message = "Access token is required")
        private String accessToken;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerifyAccountDetailsResponse {
        private String userId;
        private String accessToken;
        private String username;
        private String profilePictureUrl;
        private Integer followersCount;
        private Integer followingCount;
        private Integer mediaCount;
        private String biography;
        private boolean valid;
        private String message;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateTokenRequest {
        @NotBlank(message = "Access token is required")
        private String accessToken;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InstagramAccountDTO {
        private Long id;
        private String facebookPageId;
        private String igUserId;
        private String username;
        private String profilePictureUrl;
        private Integer followersCount;
        private Integer followingCount;
        private Integer mediaCount;
        private String biography;
        private String category;
        private String accountType;
        private AccountStatus status;
        private LocalDateTime tokenExpiresAt;
        private LocalDateTime lastRefreshedAt;
        private LocalDateTime connectedAt;
        private List<String> scopesGranted;
        private String accessToken;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FacebookPageDTO {
        private String id;
        private String name;
        private String igUserId;
        private String igUsername;
    }
}
