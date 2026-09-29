package com.fakeinstagram.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "fake_published_media", indexes = {
        @Index(name = "idx_fake_pub_media_id", columnList = "mediaId", unique = true),
        @Index(name = "idx_fake_pub_user", columnList = "igUserId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FakePublishedMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String mediaId;

    @Column(nullable = false, length = 64)
    private String igUserId;

    @Column(length = 64)
    private String containerId;

    @Column(length = 32)
    private String postType;

    @Column(length = 2048)
    private String mediaUrl;

    @Column(length = 4096)
    private String caption;

    @Column(length = 1024)
    private String permalink;

    @Column(nullable = false)
    @Builder.Default
    private int likeCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int commentsCount = 0;

    private LocalDateTime publishedAt;

    @PrePersist
    protected void onCreate() {
        if (publishedAt == null) publishedAt = LocalDateTime.now();
        if (permalink == null && mediaId != null) {
            permalink = "https://www.instagram.com/p/" + mediaId + "/";
        }
    }
}
