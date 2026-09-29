package com.instamngmt.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "scheduled_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduledPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instagram_account_id", nullable = false)
    private InstagramAccount instagramAccount;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostType postType = PostType.SINGLE_IMAGE;

    @Column(name = "idempotency_key", nullable = false, unique = true)
    private String idempotencyKey;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    private String timezone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostStatus status = PostStatus.SCHEDULED;

    private String instagramContainerId;

    private String instagramMediaId;

    private LocalDateTime publishedAt;

    @Column(columnDefinition = "TEXT")
    private String failureReason;

    private Integer retryCount = 0;

    private Integer maxAttempts = 3;

    private LocalDateTime nextAttemptAt;

    @OneToMany(mappedBy = "scheduledPost", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    @Builder.Default
    private List<PostMediaItem> mediaItems = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
