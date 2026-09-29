package com.instamngmt.service;

import com.instamngmt.dto.MediaDTOs;
import com.instamngmt.dto.PostDTOs;
import com.instamngmt.entity.*;
import com.instamngmt.exception.APIException;
import com.instamngmt.exception.ResourceNotFoundException;
import com.instamngmt.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PostService {

    private final ScheduledPostRepository scheduledPostRepository;
    private final InstagramAccountRepository instagramAccountRepository;
    private final MediaRepository mediaRepository;
    private final OutboxJobRepository outboxJobRepository;
    private final PublishingAttemptRepository publishingAttemptRepository;
    private final MediaService mediaService;
    private final InstagramPublishingWorker publishingWorker;

    public PostService(
            ScheduledPostRepository scheduledPostRepository,
            InstagramAccountRepository instagramAccountRepository,
            MediaRepository mediaRepository,
            OutboxJobRepository outboxJobRepository,
            PublishingAttemptRepository publishingAttemptRepository,
            MediaService mediaService,
            InstagramPublishingWorker publishingWorker) {
        this.scheduledPostRepository = scheduledPostRepository;
        this.instagramAccountRepository = instagramAccountRepository;
        this.mediaRepository = mediaRepository;
        this.outboxJobRepository = outboxJobRepository;
        this.publishingAttemptRepository = publishingAttemptRepository;
        this.mediaService = mediaService;
        this.publishingWorker = publishingWorker;
    }

    @Transactional
    public PostDTOs.ScheduledPostDTO createPost(User user, PostDTOs.CreatePostRequest request) {
        InstagramAccount account = instagramAccountRepository.findByIdAndUserId(request.getInstagramAccountId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("InstagramAccount", "id", request.getInstagramAccountId()));

        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new APIException(HttpStatus.BAD_REQUEST, "ACCOUNT_INACTIVE", "Selected Instagram account is inactive or token expired");
        }

        String idempotencyKey = UUID.randomUUID().toString();
        LocalDateTime scheduledAt = request.getScheduledAt() != null ? request.getScheduledAt() : LocalDateTime.now().plusMinutes(5);

        ScheduledPost post = ScheduledPost.builder()
                .user(user)
                .instagramAccount(account)
                .caption(request.getCaption())
                .postType(request.getPostType() != null ? request.getPostType() : PostType.SINGLE_IMAGE)
                .idempotencyKey(idempotencyKey)
                .scheduledAt(scheduledAt)
                .timezone(request.getTimezone() != null ? request.getTimezone() : "UTC")
                .status(PostStatus.SCHEDULED)
                .retryCount(0)
                .maxAttempts(3)
                .build();

        int pos = 0;
        for (Long mediaId : request.getMediaIds()) {
            Media media = mediaRepository.findByIdAndUserId(mediaId, user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Media", "id", mediaId));
            PostMediaItem item = PostMediaItem.builder()
                    .scheduledPost(post)
                    .media(media)
                    .position(pos++)
                    .build();
            post.getMediaItems().add(item);
        }

        post = scheduledPostRepository.save(post);

        // Transactional Outbox Job insertion
        OutboxJob outboxJob = OutboxJob.builder()
                .scheduledPostId(post.getId())
                .postType(post.getPostType())
                .scheduledAt(post.getScheduledAt())
                .status(OutboxJobStatus.PENDING)
                .build();
        outboxJobRepository.save(outboxJob);

        return mapToDTO(post);
    }

    public List<PostDTOs.ScheduledPostDTO> getUserPosts(User user) {
        return scheduledPostRepository.findByUserIdOrderByScheduledAtDesc(user.getId())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public PostDTOs.ScheduledPostDTO getPostById(User user, Long id) {
        ScheduledPost post = scheduledPostRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ScheduledPost", "id", id));
        return mapToDTO(post);
    }

    public List<PostDTOs.ScheduledPostDTO> getCalendarPosts(User user, LocalDateTime start, LocalDateTime end) {
        return scheduledPostRepository.findByUserIdAndScheduledAtBetween(user.getId(), start, end)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PostDTOs.ScheduledPostDTO updateScheduledPost(User user, Long id, PostDTOs.UpdatePostRequest request) {
        ScheduledPost post = scheduledPostRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ScheduledPost", "id", id));

        if (post.getStatus() != PostStatus.SCHEDULED && post.getStatus() != PostStatus.FAILED_RETRYABLE) {
            throw new APIException(HttpStatus.BAD_REQUEST, "CANNOT_EDIT", "Only scheduled or retryable posts can be edited");
        }

        if (request.getCaption() != null) {
            post.setCaption(request.getCaption());
        }

        if (request.getScheduledAt() != null) {
            post.setScheduledAt(request.getScheduledAt());

            List<OutboxJob> outboxJobs = outboxJobRepository.findByScheduledPostId(post.getId());
            for (OutboxJob job : outboxJobs) {
                if (job.getStatus() == OutboxJobStatus.PENDING) {
                    job.setScheduledAt(request.getScheduledAt());
                    outboxJobRepository.save(job);
                }
            }
        }

        if (request.getTimezone() != null) {
            post.setTimezone(request.getTimezone());
        }

        post = scheduledPostRepository.save(post);
        return mapToDTO(post);
    }

    @Transactional
    public PostDTOs.ScheduledPostDTO publishNow(User user, Long id) {
        ScheduledPost post = scheduledPostRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ScheduledPost", "id", id));

        if (post.getStatus() == PostStatus.PUBLISHED) {
            throw new APIException(HttpStatus.BAD_REQUEST, "ALREADY_PUBLISHED", "Post is already published");
        }

        post.setScheduledAt(LocalDateTime.now());
        post.setStatus(PostStatus.SCHEDULED);
        post.setFailureReason(null);
        post.setNextAttemptAt(null);
        if (post.getRetryCount() == null) {
            post.setRetryCount(0);
        }
        if (post.getMaxAttempts() == null) {
            post.setMaxAttempts(3);
        }
        post = scheduledPostRepository.save(post);

        // Delete existing pending outbox jobs to prevent duplicate poller runs
        List<OutboxJob> outboxJobs = outboxJobRepository.findByScheduledPostId(post.getId());
        List<OutboxJob> pendingJobs = outboxJobs.stream()
                .filter(job -> job.getStatus() == OutboxJobStatus.PENDING)
                .collect(Collectors.toList());
        outboxJobRepository.deleteAll(pendingJobs);

        // Trigger immediate publishing async
        publishingWorker.executePublishing(post.getId());

        return mapToDTO(post);
    }

    @Transactional
    public PostDTOs.ScheduledPostDTO cancelPost(User user, Long id) {
        ScheduledPost post = scheduledPostRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ScheduledPost", "id", id));

        if (post.getStatus() == PostStatus.PUBLISHED) {
            throw new APIException(HttpStatus.BAD_REQUEST, "CANNOT_CANCEL", "Cannot cancel a post that is already published");
        }

        post.setStatus(PostStatus.CANCELLED);
        post = scheduledPostRepository.save(post);

        List<OutboxJob> outboxJobs = outboxJobRepository.findByScheduledPostId(post.getId());
        List<OutboxJob> pendingJobs = outboxJobs.stream()
                .filter(job -> job.getStatus() == OutboxJobStatus.PENDING)
                .collect(Collectors.toList());
        outboxJobRepository.deleteAll(pendingJobs);

        return mapToDTO(post);
    }

    @Transactional
    public PostDTOs.ScheduledPostDTO retryPost(User user, Long id) {
        ScheduledPost post = scheduledPostRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ScheduledPost", "id", id));

        post.setStatus(PostStatus.SCHEDULED);
        post.setScheduledAt(LocalDateTime.now());
        post.setFailureReason(null);
        post.setNextAttemptAt(null);
        post = scheduledPostRepository.save(post);

        OutboxJob outboxJob = OutboxJob.builder()
                .scheduledPostId(post.getId())
                .postType(post.getPostType())
                .scheduledAt(post.getScheduledAt())
                .status(OutboxJobStatus.PENDING)
                .build();
        outboxJobRepository.save(outboxJob);

        return mapToDTO(post);
    }

    @Transactional
    public void deletePost(User user, Long id) {
        ScheduledPost post = scheduledPostRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ScheduledPost", "id", id));
        List<OutboxJob> outboxJobs = outboxJobRepository.findByScheduledPostId(post.getId());
        outboxJobRepository.deleteAll(outboxJobs);
        scheduledPostRepository.delete(post);
    }

    public PostDTOs.ScheduledPostDTO mapToDTO(ScheduledPost post) {
        List<MediaDTOs.MediaDTO> mediaDTOs = post.getMediaItems().stream()
                .map(item -> mediaService.mapToDTO(item.getMedia()))
                .collect(Collectors.toList());

        List<PostDTOs.PublishingAttemptDTO> attempts = publishingAttemptRepository
                .findByScheduledPostIdOrderByCreatedAtDesc(post.getId())
                .stream()
                .map(a -> PostDTOs.PublishingAttemptDTO.builder()
                        .id(a.getId())
                        .attemptNumber(a.getAttemptNumber())
                        .operation(a.getOperation().name())
                        .requestTimestamp(a.getRequestTimestamp())
                        .responseStatus(a.getResponseStatus())
                        .metaErrorCode(a.getMetaErrorCode())
                        .isRetryable(a.getIsRetryable())
                        .responseBody(a.getResponseBody())
                        .errorMessage(a.getErrorMessage())
                        .createdAt(a.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return PostDTOs.ScheduledPostDTO.builder()
                .id(post.getId())
                .instagramAccountId(post.getInstagramAccount().getId())
                .instagramUsername(post.getInstagramAccount().getUsername())
                .caption(post.getCaption())
                .postType(post.getPostType())
                .idempotencyKey(post.getIdempotencyKey())
                .scheduledAt(post.getScheduledAt())
                .timezone(post.getTimezone())
                .status(post.getStatus())
                .instagramContainerId(post.getInstagramContainerId())
                .instagramMediaId(post.getInstagramMediaId())
                .publishedAt(post.getPublishedAt())
                .failureReason(post.getFailureReason())
                .retryCount(post.getRetryCount())
                .maxAttempts(post.getMaxAttempts())
                .nextAttemptAt(post.getNextAttemptAt())
                .mediaItems(mediaDTOs)
                .createdAt(post.getCreatedAt())
                .publishingAttempts(attempts)
                .build();
    }
}
