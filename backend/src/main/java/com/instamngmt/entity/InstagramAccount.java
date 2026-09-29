package com.instamngmt.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "instagram_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstagramAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "facebook_page_id")
    private String facebookPageId;

    @Column(name = "ig_user_id", nullable = false)
    private String igUserId;

    @Column(nullable = false)
    private String username;

    @Column(name = "profile_picture_url", columnDefinition = "TEXT")
    private String profilePictureUrl;

    @Column(name = "followers_count")
    private Integer followersCount = 0;

    @Column(name = "following_count")
    private Integer followingCount = 0;

    @Column(name = "media_count")
    private Integer mediaCount = 0;

    @Column(columnDefinition = "TEXT")
    private String biography;

    private String category;

    private String accountType = "BUSINESS";

    @Column(name = "access_token_encrypted", columnDefinition = "TEXT", nullable = false)
    private String accessTokenEncrypted;

    private LocalDateTime tokenExpiresAt;

    private LocalDateTime lastRefreshedAt;

    @Column(columnDefinition = "TEXT")
    private String scopesGranted;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(nullable = false, updatable = false)
    private LocalDateTime connectedAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.connectedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
