package com.fakeinstagram.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "fake_tokens", indexes = {
        @Index(name = "idx_fake_token_val", columnList = "token", unique = true),
        @Index(name = "idx_fake_token_user", columnList = "igUserId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FakeToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 512)
    private String token;

    @Column(nullable = false, length = 64)
    private String igUserId;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "VALID"; // VALID, EXPIRED, REVOKED, INVALID

    @Column(length = 512)
    @Builder.Default
    private String scopes = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement";

    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (expiresAt == null) expiresAt = LocalDateTime.now().plusDays(60);
    }

    public boolean isExpired() {
        return "EXPIRED".equalsIgnoreCase(status) || (expiresAt != null && expiresAt.isBefore(LocalDateTime.now()));
    }

    public boolean isValid() {
        return "VALID".equalsIgnoreCase(status) && !isExpired();
    }
}
