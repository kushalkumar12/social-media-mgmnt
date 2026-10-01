package com.instamngmt.event;

import com.instamngmt.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService notificationService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handleNotificationEvent(NotificationEvent event) {
        try {
            notificationService.createAndSend(
                    event.getUser(),
                    event.getUserId(),
                    event.getTitle(),
                    event.getMessage(),
                    event.getType(),
                    event.getSeverity(),
                    event.getLink(),
                    event.getMetadata()
            );
        } catch (Exception ex) {
            log.error("Failed to handle notification event: {}", ex.getMessage(), ex);
        }
    }
}
