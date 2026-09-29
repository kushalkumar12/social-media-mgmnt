package com.fakeinstagram.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "fake_accounts", indexes = {
        @Index(name = "idx_fake_acc_user_id", columnList = "igUserId", unique = true),
        @Index(name = "idx_fake_acc_username", columnList = "username", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FakeAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String igUserId;

    @Column(nullable = false, unique = true, length = 128)
    private String username;

    @Column(length = 255)
    private String name;

    @Column(length = 1024)
    private String profilePictureUrl;

    @Column(nullable = false)
    private int followersCount;

    @Column(nullable = false)
    private int followingCount;

    @Column(nullable = false)
    private int mediaCount;

    @Column(length = 2048)
    private String biography;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String accountType = "BUSINESS";

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "ACTIVE";

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
