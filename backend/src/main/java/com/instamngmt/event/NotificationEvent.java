package com.instamngmt.event;

import com.instamngmt.entity.NotificationSeverity;
import com.instamngmt.entity.NotificationType;
import com.instamngmt.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationEvent {
    private User user;
    private Long userId;
    private String title;
    private String message;
    private NotificationType type;
    private NotificationSeverity severity;
    private String link;
    private String metadata;
}
