package com.instamngmt.controller;

import com.instamngmt.dto.NotificationDTOs;
import com.instamngmt.entity.User;
import com.instamngmt.service.AuthService;
import com.instamngmt.service.NotificationService;
import com.instamngmt.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthService authService;
    private final SseEmitterService sseEmitterService;

    @GetMapping
    public ResponseEntity<NotificationDTOs.NotificationListResponse> getNotifications(
            @RequestParam(name = "unreadOnly", defaultValue = "false") Boolean unreadOnly,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "15") int size) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(notificationService.getUserNotifications(currentUser, unreadOnly, page, size));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<NotificationDTOs.UnreadCountDTO> getUnreadCount() {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(notificationService.getUnreadCount(currentUser));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationDTOs.NotificationDTO> markAsRead(@PathVariable Long id) {
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(notificationService.markAsRead(currentUser, id));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead() {
        User currentUser = authService.getCurrentUser();
        notificationService.markAllAsRead(currentUser);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        User currentUser = authService.getCurrentUser();
        notificationService.deleteNotification(currentUser, id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<Void> clearAllRead() {
        User currentUser = authService.getCurrentUser();
        notificationService.clearAllRead(currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications() {
        User currentUser = authService.getCurrentUser();
        return sseEmitterService.createEmitter(currentUser.getId());
    }
}
