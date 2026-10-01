package com.instamngmt.service;

import com.instamngmt.dto.ExcelDTOs;
import com.instamngmt.entity.*;
import com.instamngmt.event.NotificationEvent;
import com.instamngmt.repository.BulkImportBatchRepository;
import com.instamngmt.repository.MediaRepository;
import com.instamngmt.repository.OutboxJobRepository;
import com.instamngmt.repository.ScheduledPostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncBulkImportProcessor {

    private final BulkImportBatchRepository bulkImportBatchRepository;
    private final ScheduledPostRepository scheduledPostRepository;
    private final OutboxJobRepository outboxJobRepository;
    private final MediaRepository mediaRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Executes bulk Excel row ingestion in the background for large batches (> 199 rows).
     */
    @Async
    public CompletableFuture<Integer> processBatchInBackground(
            User user,
            List<InstagramAccount> targetAccounts,
            Long batchId,
            String fileName,
            List<ExcelDTOs.ExcelRowPreview> rowsToProcess) {
        log.info("Starting background processing of bulk import batchId={} with {} rows across {} accounts for user={}",
                batchId, rowsToProcess.size(), targetAccounts.size(), user.getId());

        int totalTasks = rowsToProcess.size() * targetAccounts.size();
        ExecutorService executor = Executors.newFixedThreadPool(Math.min(Math.max(totalTasks, 1), 10));
        List<Future<Boolean>> futures = new ArrayList<>();

        for (InstagramAccount account : targetAccounts) {
            for (ExcelDTOs.ExcelRowPreview row : rowsToProcess) {
                futures.add(executor.submit(() -> processAndSaveSingleRow(user, account, row)));
            }
        }

        int successCount = 0;
        for (Future<Boolean> future : futures) {
            try {
                if (future.get(30, TimeUnit.SECONDS)) {
                    successCount++;
                }
            } catch (Exception e) {
                log.error("Error processing row in background batchId={}", batchId, e);
            }
        }

        executor.shutdown();

        // Update Batch entity in database
        try {
            bulkImportBatchRepository.findById(batchId).ifPresent(batch -> {
                batch.setStatus("COMPLETED");
                batch.setValidRows(rowsToProcess.size());
                bulkImportBatchRepository.save(batch);
            });
        } catch (Exception e) {
            log.error("Failed to update status for batchId={}", batchId, e);
        }

        log.info("Completed background bulk scheduling: batchId={} successCount={}/{}",
                batchId, successCount, totalTasks);

        // Publish completion notification event (Pushed via SSE & saved in DB)
        String message = targetAccounts.size() > 1
                ? String.format("Successfully scheduled %d post(s) across %d account(s) from '%s' in background.", successCount, targetAccounts.size(), fileName)
                : String.format("Successfully scheduled %d post(s) from '%s' in background.", successCount, fileName);

        eventPublisher.publishEvent(NotificationEvent.builder()
                .user(user)
                .title("Bulk Import Completed")
                .message(message)
                .type(NotificationType.BULK_IMPORT_COMPLETED)
                .severity(NotificationSeverity.SUCCESS)
                .link("/posts")
                .build());

        return CompletableFuture.completedFuture(successCount);
    }

    public boolean processAndSaveSingleRow(User user, InstagramAccount account, ExcelDTOs.ExcelRowPreview row) {
        try {
            // 1. Create Media Entity
            MediaType mediaType = "REEL".equalsIgnoreCase(row.getPostType())
                    || "VIDEO".equalsIgnoreCase(row.getPostType())
                            ? MediaType.VIDEO
                            : MediaType.IMAGE;

            Media media = Media.builder()
                    .user(user)
                    .fileName(row.getName() != null && !row.getName().isBlank() ? row.getName() : "Bulk Imported Media")
                    .storageKey("external-url-" + UUID.randomUUID())
                    .cdnUrl(row.getMediaUrl())
                    .mediaType(mediaType)
                    .fileSize(1024L * 1024L) // placeholder 1MB
                    .build();
            media = mediaRepository.save(media);

            // 2. Map Post Type
            PostType postType = PostType.SINGLE_IMAGE;
            if ("REEL".equalsIgnoreCase(row.getPostType()) || "REELS".equalsIgnoreCase(row.getPostType())) {
                postType = PostType.REELS;
            } else if ("VIDEO".equalsIgnoreCase(row.getPostType())) {
                postType = PostType.SINGLE_VIDEO;
            } else if ("STORY".equalsIgnoreCase(row.getPostType())) {
                postType = PostType.STORY;
            } else if ("CAROUSEL".equalsIgnoreCase(row.getPostType())) {
                postType = PostType.CAROUSEL;
            }

            // 3. Create Scheduled Post
            ScheduledPost post = ScheduledPost.builder()
                    .user(user)
                    .instagramAccount(account)
                    .caption(row.getCaption())
                    .postType(postType)
                    .idempotencyKey(UUID.randomUUID().toString())
                    .scheduledAt(row.getScheduledTime())
                    .timezone("Asia/Kolkata")
                    .status(PostStatus.SCHEDULED)
                    .retryCount(0)
                    .maxAttempts(3)
                    .build();

            PostMediaItem mediaItem = PostMediaItem.builder()
                    .scheduledPost(post)
                    .media(media)
                    .position(0)
                    .build();
            post.getMediaItems().add(mediaItem);

            post = scheduledPostRepository.save(post);

            // 4. Create Outbox Job for OutboxPollerScheduler
            OutboxJob outboxJob = OutboxJob.builder()
                    .scheduledPostId(post.getId())
                    .postType(post.getPostType())
                    .scheduledAt(post.getScheduledAt())
                    .status(OutboxJobStatus.PENDING)
                    .retryCount(0)
                    .build();

            outboxJobRepository.save(outboxJob);
            return true;
        } catch (Exception e) {
            log.error("Failed to persist bulk post row {}", row.getRowIndex(), e);
            return false;
        }
    }
}
