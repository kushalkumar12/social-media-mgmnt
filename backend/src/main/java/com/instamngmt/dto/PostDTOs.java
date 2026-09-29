package com.instamngmt.dto;

import com.instamngmt.entity.PostStatus;
import com.instamngmt.entity.PostType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class PostDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreatePostRequest {
        private Long instagramAccountId;
        private Long accountGroupId;
        private List<Long> instagramAccountIds;

        private String caption;

        @NotNull(message = "Post type is required")
        private PostType postType;

        @NotEmpty(message = "At least one media ID is required")
        private List<Long> mediaIds;

        @NotNull(message = "Scheduled date and time is required")
        private LocalDateTime scheduledAt;

        private String timezone;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdatePostRequest {
        private String caption;
        private LocalDateTime scheduledAt;
        private String timezone;
        private List<Long> mediaIds;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScheduledPostDTO {
        private Long id;
        private Long instagramAccountId;
        private String instagramUsername;
        private String caption;
        private PostType postType;
        private String idempotencyKey;
        private LocalDateTime scheduledAt;
        private String timezone;
        private PostStatus status;
        private String instagramContainerId;
        private String instagramMediaId;
        private LocalDateTime publishedAt;
        private String failureReason;
        private Integer retryCount;
        private Integer maxAttempts;
        private LocalDateTime nextAttemptAt;
        private List<MediaDTOs.MediaDTO> mediaItems;
        private LocalDateTime createdAt;
        private List<PublishingAttemptDTO> publishingAttempts;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PublishingAttemptDTO {
        private Long id;
        private Integer attemptNumber;
        private String operation;
        private LocalDateTime requestTimestamp;
        private Integer responseStatus;
        private String metaErrorCode;
        private Boolean isRetryable;
        private String responseBody;
        private String errorMessage;
        private LocalDateTime createdAt;
    }
}
