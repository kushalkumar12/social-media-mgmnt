package com.fakeinstagram.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "fake_comments", indexes = {
        @Index(name = "idx_fake_comment_id", columnList = "commentId", unique = true),
        @Index(name = "idx_fake_comment_media", columnList = "mediaId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FakeComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String commentId;

    @Column(nullable = false, length = 64)
    private String mediaId;

    @Column(nullable = false, length = 128)
    private String username;

    @Column(nullable = false, length = 2048)
    private String text;

    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }
}
