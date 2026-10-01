package com.instamngmt.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "publishing_attempts",
    indexes = {
        @Index(name = "idx_pub_att_post_created", columnList = "scheduled_post_id, created_at DESC")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublishingAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheduled_post_id", nullable = false)
    private ScheduledPost scheduledPost;

    @Column(nullable = false)
    private Integer attemptNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OperationType operation;

    @Column(nullable = false)
    private LocalDateTime requestTimestamp;

    private Integer responseStatus;

    private String metaErrorCode;

    private Boolean isRetryable;

    @Column(columnDefinition = "TEXT")
    private String responseBody;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
