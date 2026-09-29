package com.instamngmt.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private String role = "USER";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserPlan plan = UserPlan.SINGLE;

    @Column(nullable = false)
    @Builder.Default
    private Integer accountLimit = 1;

    private LocalDateTime trialExpiresAt;

    @Builder.Default
    private Boolean emailVerified = false;

    private String otpCode;
    private LocalDateTime otpExpiresAt;

    private String resetToken;
    private LocalDateTime resetTokenExpiresAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.trialExpiresAt == null) {
            this.trialExpiresAt = LocalDateTime.now().plusDays(15); // 15 days free trial
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
