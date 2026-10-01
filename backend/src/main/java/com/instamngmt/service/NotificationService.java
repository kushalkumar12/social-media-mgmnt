package com.instamngmt.service;

import com.instamngmt.dto.NotificationDTOs;
import com.instamngmt.entity.Notification;
import com.instamngmt.entity.NotificationSeverity;
import com.instamngmt.entity.NotificationType;
import com.instamngmt.entity.User;
import com.instamngmt.exception.ResourceNotFoundException;
import com.instamngmt.repository.NotificationRepository;
import com.instamngmt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SseEmitterService sseEmitterService;

    @Transactional
    public NotificationDTOs.NotificationDTO createAndSend(
            User user,
            Long userId,
            String title,
            String message,
            NotificationType type,
            NotificationSeverity severity,
            String link,
            String metadata) {

        User recipient = user;
        if (recipient == null && userId != null) {
            recipient = userRepository.findById(userId).orElse(null);
        }

        if (recipient == null) {
            log.warn("Cannot create notification: recipient user is null");
            return null;
        }

        Notification notification = Notification.builder()
                .user(recipient)
                .title(title)
                .message(message)
                .type(type)
                .severity(severity)
                .isRead(false)
                .link(link)
                .metadata(metadata)
                .build();

        notification = notificationRepository.save(notification);
        NotificationDTOs.NotificationDTO dto = mapToDTO(notification);

        // Push real-time event to connected active browser tabs
        try {
            sseEmitterService.sendToUser(recipient.getId(), "NOTIFICATION", dto);
            long unread = notificationRepository.countByUserIdAndIsReadFalse(recipient.getId());
            sseEmitterService.sendToUser(recipient.getId(), "UNREAD_COUNT", new NotificationDTOs.UnreadCountDTO(unread));
        } catch (Exception e) {
            log.warn("Failed to push SSE notification for user {}: {}", recipient.getId(), e.getMessage());
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public NotificationDTOs.NotificationListResponse getUserNotifications(User user, Boolean unreadOnly, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, Math.min(100, size)));
        Page<Notification> pageResult;

        if (Boolean.TRUE.equals(unreadOnly)) {
            pageResult = notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(user.getId(), false, pageable);
        } else {
            pageResult = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        }

        List<NotificationDTOs.NotificationDTO> items = pageResult.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(user.getId());

        return NotificationDTOs.NotificationListResponse.builder()
                .items(items)
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .unreadCount(unreadCount)
                .build();
    }

    @Transactional(readOnly = true)
    public NotificationDTOs.UnreadCountDTO getUnreadCount(User user) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        return new NotificationDTOs.UnreadCountDTO(count);
    }

    @Transactional
    public NotificationDTOs.NotificationDTO markAsRead(User user, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification = notificationRepository.save(notification);

            long unread = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
            sseEmitterService.sendToUser(user.getId(), "UNREAD_COUNT", new NotificationDTOs.UnreadCountDTO(unread));
        }

        return mapToDTO(notification);
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsRead(user.getId());
        sseEmitterService.sendToUser(user.getId(), "UNREAD_COUNT", new NotificationDTOs.UnreadCountDTO(0));
    }

    @Transactional
    public void deleteNotification(User user, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        notificationRepository.delete(notification);
        long unread = notificationRepository.countByUserIdAndIsReadFalse(user.getId());
        sseEmitterService.sendToUser(user.getId(), "UNREAD_COUNT", new NotificationDTOs.UnreadCountDTO(unread));
    }

    @Transactional
    public void clearAllRead(User user) {
        notificationRepository.deleteAllRead(user.getId());
    }

    public NotificationDTOs.NotificationDTO mapToDTO(Notification n) {
        return NotificationDTOs.NotificationDTO.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .severity(n.getSeverity())
                .isRead(n.getIsRead())
                .link(n.getLink())
                .metadata(n.getMetadata())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
