package com.instamngmt.service;

import com.instamngmt.entity.*;
import com.instamngmt.repository.*;
import com.instamngmt.util.EncryptionUtil;
import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import com.instamngmt.event.NotificationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class InstagramPublishingWorker {

    private static final Logger log = LoggerFactory.getLogger(InstagramPublishingWorker.class);

    private final ScheduledPostRepository scheduledPostRepository;
    private final PublishingAttemptRepository publishingAttemptRepository;
    private final InstagramClientService instagramClientService;
    private final RateLimitService rateLimitService;
    private final ErrorTaxonomyService errorTaxonomyService;
    private final EncryptionUtil encryptionUtil;
    private final ApplicationEventPublisher eventPublisher;

    public InstagramPublishingWorker(
            ScheduledPostRepository scheduledPostRepository,
            PublishingAttemptRepository publishingAttemptRepository,
            InstagramClientService instagramClientService,
            RateLimitService rateLimitService,
            ErrorTaxonomyService errorTaxonomyService,
            EncryptionUtil encryptionUtil,
            ApplicationEventPublisher eventPublisher) {
        this.scheduledPostRepository = scheduledPostRepository;
        this.publishingAttemptRepository = publishingAttemptRepository;
        this.instagramClientService = instagramClientService;
        this.rateLimitService = rateLimitService;
        this.errorTaxonomyService = errorTaxonomyService;
        this.encryptionUtil = encryptionUtil;
        this.eventPublisher = eventPublisher;
    }

    @Async
    @Transactional
    @CircuitBreaker(name = "instagramPublishing", fallbackMethod = "handleCircuitBreakerFallback")
    @Bulkhead(name = "instagramPublishing")
    public void executePublishing(Long scheduledPostId) {
        ScheduledPost post = scheduledPostRepository.findById(scheduledPostId).orElse(null);
        if (post == null) return;

        // Idempotency fencing & status guard
        if (post.getStatus() == PostStatus.PUBLISHED || post.getStatus() == PostStatus.CANCELLED) {
            log.info("Post {} is already in terminal state: {}", scheduledPostId, post.getStatus());
            return;
        }

        InstagramAccount account = post.getInstagramAccount();
        if (account.getStatus() != AccountStatus.ACTIVE) {
            markFailedTerminal(post, "Instagram account token is expired or deauthorized. Re-authorization required.");
            return;
        }

        // Check rolling 24-hour rate limit ledger
        if (!rateLimitService.canPublish(account.getId())) {
            log.warn("Rate limit exceeded for account {}. Rescheduling post {}", account.getId(), post.getId());
            post.setStatus(PostStatus.FAILED_RETRYABLE);
            post.setNextAttemptAt(LocalDateTime.now().plusHours(1));
            post.setFailureReason("Instagram 24-hour publishing rate limit reached. Rescheduled.");
            scheduledPostRepository.save(post);
            eventPublisher.publishEvent(NotificationEvent.builder()
                    .user(post.getUser())
                    .title("Rate Limit Warning")
                    .message("Instagram 24-hour rate limit reached for @" + account.getUsername() + ". Post #" + post.getId() + " rescheduled.")
                    .type(NotificationType.RATE_LIMIT_WARNING)
                    .severity(NotificationSeverity.WARNING)
                    .link("/instagram/accounts")
                    .build());
            return;
        }

        String decryptedToken = encryptionUtil.decrypt(account.getAccessTokenEncrypted());
        log.info("DIAGNOSTIC: Account ID={}, igUserId={}, tokenLength={}, tokenPrefix={}, tokenSuffix={}",
                account.getId(),
                account.getIgUserId(),
                decryptedToken != null ? decryptedToken.length() : 0,
                decryptedToken != null && decryptedToken.length() >= 6 ? decryptedToken.substring(0, 6) : "null",
                decryptedToken != null && decryptedToken.length() >= 6 ? decryptedToken.substring(decryptedToken.length() - 4) : "null");
        int currentRetries = post.getRetryCount() != null ? post.getRetryCount() : 0;
        int maxAttempts = post.getMaxAttempts() != null ? post.getMaxAttempts() : 3;
        int attemptNum = currentRetries + 1;
        post.setRetryCount(attemptNum);
        if (post.getMaxAttempts() == null) {
            post.setMaxAttempts(maxAttempts);
        }

        try {
            // Step 1: Create Container
            post.setStatus(PostStatus.CREATING_CONTAINER);
            scheduledPostRepository.save(post);

            List<PostMediaItem> mediaItems = post.getMediaItems();
            if (mediaItems.isEmpty()) {
                markFailedTerminal(post, "Post has no attached media items");
                return;
            }

            String containerId = post.getInstagramContainerId();
            if (containerId == null || containerId.isEmpty()) {
                if (post.getPostType() == PostType.CAROUSEL && mediaItems.size() > 1) {
                    List<String> childContainerIds = new ArrayList<>();
                    for (PostMediaItem item : mediaItems) {
                        String childId = instagramClientService.createMediaContainer(
                                account.getIgUserId(), decryptedToken, MediaType.IMAGE == item.getMedia().getMediaType() ? PostType.SINGLE_IMAGE : PostType.SINGLE_VIDEO,
                                item.getMedia().getCdnUrl(), null, null, true
                        );
                        childContainerIds.add(childId);
                    }
                    containerId = instagramClientService.createMediaContainer(
                            account.getIgUserId(), decryptedToken, PostType.CAROUSEL, null, post.getCaption(), childContainerIds
                    );
                } else {
                    Media firstMedia = mediaItems.get(0).getMedia();
                    containerId = instagramClientService.createMediaContainer(
                            account.getIgUserId(), decryptedToken, post.getPostType(), firstMedia.getCdnUrl(), post.getCaption(), null
                    );
                }
                post.setInstagramContainerId(containerId);
                scheduledPostRepository.save(post);
                recordAttempt(post, attemptNum, OperationType.CREATE_CONTAINER, 200, null, true, "Container created successfully: " + containerId, null);
            }

            // Step 2: Check Container Processing Status (wait if IN_PROGRESS)
            post.setStatus(PostStatus.CONTAINER_PROCESSING);
            scheduledPostRepository.save(post);

            InstagramClientService.ContainerStatus containerStatus = instagramClientService.checkContainerStatus(containerId, decryptedToken);
            int pollAttempts = 0;
            while ("IN_PROGRESS".equalsIgnoreCase(containerStatus.statusCode()) && pollAttempts < 15) {
                log.info("Container {} is IN_PROGRESS. Waiting 3s (poll {}/15)...", containerId, pollAttempts + 1);
                try {
                    Thread.sleep(3000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
                pollAttempts++;
                containerStatus = instagramClientService.checkContainerStatus(containerId, decryptedToken);
            }

            recordAttempt(post, attemptNum, OperationType.CHECK_STATUS, 200, null, true, "Status: " + containerStatus.statusCode(), null);

            if ("ERROR".equalsIgnoreCase(containerStatus.statusCode()) || "EXPIRED".equalsIgnoreCase(containerStatus.statusCode())) {
                String errorDetails = containerStatus.statusMessage() != null && !containerStatus.statusMessage().isBlank() 
                        ? containerStatus.statusMessage() : containerStatus.statusCode();
                markFailedTerminal(post, "Meta container processing failed: " + errorDetails);
                return;
            }

            // Step 3: Publish Media Container
            post.setStatus(PostStatus.PUBLISHING);
            scheduledPostRepository.save(post);

            String mediaId = instagramClientService.publishMedia(account.getIgUserId(), containerId, decryptedToken);
            post.setInstagramMediaId(mediaId);
            post.setStatus(PostStatus.PUBLISHED);
            post.setPublishedAt(LocalDateTime.now());
            post.setFailureReason(null);
            scheduledPostRepository.save(post);

            rateLimitService.recordPublishAttempt(account.getId());
            recordAttempt(post, attemptNum, OperationType.PUBLISH_MEDIA, 200, null, false, "Published successfully! Media ID: " + mediaId, null);
            log.info("Successfully published post {} to Instagram! Media ID: {}", post.getId(), mediaId);

            eventPublisher.publishEvent(NotificationEvent.builder()
                    .user(post.getUser())
                    .title("Post Published")
                    .message("Post #" + post.getId() + " was successfully published to @" + account.getUsername())
                    .type(NotificationType.POST_PUBLISHED)
                    .severity(NotificationSeverity.SUCCESS)
                    .link("/posts")
                    .build());

        } catch (Exception ex) {
            log.error("Exception occurred while publishing post {}", post.getId(), ex);
            boolean retryable = errorTaxonomyService.isRetryable(500, ex.getMessage());
            recordAttempt(post, attemptNum, OperationType.PUBLISH_MEDIA, 500, "SYSTEM_ERROR", retryable, null, ex.getMessage());

            if (retryable && attemptNum < maxAttempts) {
                post.setStatus(PostStatus.FAILED_RETRYABLE);
                post.setFailureReason(ex.getMessage());
                // Exponential backoff: 30s, 60s, 120s
                long backoffSeconds = (long) Math.pow(2, attemptNum) * 15;
                post.setNextAttemptAt(LocalDateTime.now().plusSeconds(backoffSeconds));
                scheduledPostRepository.save(post);

                eventPublisher.publishEvent(NotificationEvent.builder()
                        .user(post.getUser())
                        .title("Publishing Delayed / Retrying")
                        .message("Post #" + post.getId() + " hit an error and will retry at " + post.getNextAttemptAt())
                        .type(NotificationType.POST_RETRYING)
                        .severity(NotificationSeverity.WARNING)
                        .link("/posts")
                        .build());
            } else {
                markFailedTerminal(post, ex.getMessage());
            }
        }
    }

    public void handleCircuitBreakerFallback(Long scheduledPostId, Throwable t) {
        log.error("Circuit breaker tripped for post {}: {}", scheduledPostId, t.getMessage());
        ScheduledPost post = scheduledPostRepository.findById(scheduledPostId).orElse(null);
        if (post != null) {
            post.setStatus(PostStatus.FAILED_RETRYABLE);
            post.setFailureReason("Meta API circuit breaker active: " + t.getMessage());
            post.setNextAttemptAt(LocalDateTime.now().plusMinutes(5));
            scheduledPostRepository.save(post);

            eventPublisher.publishEvent(NotificationEvent.builder()
                    .user(post.getUser())
                    .title("Circuit Breaker Active")
                    .message("Meta API publishing temporarily paused: " + t.getMessage())
                    .type(NotificationType.CIRCUIT_BREAKER_ACTIVE)
                    .severity(NotificationSeverity.ERROR)
                    .link("/dashboard")
                    .build());
        }
    }

    private void markFailedTerminal(ScheduledPost post, String reason) {
        post.setStatus(PostStatus.FAILED_TERMINAL);
        post.setFailureReason(reason);
        scheduledPostRepository.save(post);
        log.error("Post {} marked as FAILED_TERMINAL: {}", post.getId(), reason);

        eventPublisher.publishEvent(NotificationEvent.builder()
                .user(post.getUser())
                .title("Publishing Failed")
                .message("Post #" + post.getId() + " failed permanently: " + reason)
                .type(NotificationType.POST_FAILED)
                .severity(NotificationSeverity.ERROR)
                .link("/posts")
                .build());
    }

    private void recordAttempt(ScheduledPost post, int attemptNum, OperationType op, Integer status, String errCode, boolean isRetryable, String body, String errorMsg) {
        PublishingAttempt attempt = PublishingAttempt.builder()
                .scheduledPost(post)
                .attemptNumber(attemptNum)
                .operation(op)
                .requestTimestamp(LocalDateTime.now())
                .responseStatus(status)
                .metaErrorCode(errCode)
                .isRetryable(isRetryable)
                .responseBody(body)
                .errorMessage(errorMsg)
                .build();
        publishingAttemptRepository.save(attempt);
    }
}
