package com.instamngmt.dto;

import com.instamngmt.entity.NotificationSeverity;
import com.instamngmt.entity.NotificationType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class NotificationDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NotificationDTO {
        private Long id;
        private String title;
        private String message;
        private NotificationType type;
        private NotificationSeverity severity;
        private Boolean isRead;
        private String link;
        private String metadata;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UnreadCountDTO {
        private long unreadCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NotificationListResponse {
        private List<NotificationDTO> items;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private long unreadCount;
    }
}
