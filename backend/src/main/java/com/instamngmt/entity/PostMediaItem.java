package com.instamngmt.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "post_media_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostMediaItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheduled_post_id", nullable = false)
    private ScheduledPost scheduledPost;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "media_id", nullable = false)
    private Media media;

    @Column(nullable = false)
    private Integer position;
}
