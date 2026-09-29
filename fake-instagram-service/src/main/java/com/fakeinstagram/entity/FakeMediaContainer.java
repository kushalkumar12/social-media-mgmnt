package com.fakeinstagram.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "fake_media_containers", indexes = {
        @Index(name = "idx_fake_cnt_id", columnList = "containerId", unique = true),
        @Index(name = "idx_fake_cnt_user", columnList = "igUserId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FakeMediaContainer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String containerId;

    @Column(nullable = false, length = 64)
    private String igUserId;

    @Column(nullable = false, length = 32)
    private String postType; // SINGLE_IMAGE, SINGLE_VIDEO, REELS, CAROUSEL

    @Column(length = 2048)
    private String mediaUrl;

    @Column(length = 4096)
    private String caption;

    @Column(nullable = false)
    @Builder.Default
    private boolean isCarouselItem = false;

    @Column(length = 4096)
    private String childrenJson;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String statusCode = "FINISHED"; // IN_PROGRESS, FINISHED, ERROR, EXPIRED

    @Column(length = 512)
    private String statusMessage;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
