package com.instamngmt.scheduler;

import com.instamngmt.entity.OutboxJob;
import com.instamngmt.entity.OutboxJobStatus;
import com.instamngmt.entity.PostStatus;
import com.instamngmt.entity.ScheduledPost;
import com.instamngmt.repository.OutboxJobRepository;
import com.instamngmt.repository.ScheduledPostRepository;
import com.instamngmt.service.InstagramPublishingWorker;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class OutboxPollerScheduler {

    private static final Logger log = LoggerFactory.getLogger(OutboxPollerScheduler.class);

    private final OutboxJobRepository outboxJobRepository;
    private final ScheduledPostRepository scheduledPostRepository;
    private final InstagramPublishingWorker publishingWorker;

    public OutboxPollerScheduler(
            OutboxJobRepository outboxJobRepository,
            ScheduledPostRepository scheduledPostRepository,
            InstagramPublishingWorker publishingWorker) {
        this.outboxJobRepository = outboxJobRepository;
        this.scheduledPostRepository = scheduledPostRepository;
        this.publishingWorker = publishingWorker;
    }

    @Scheduled(fixedRate = 10000) // Poll every 10 seconds
    @SchedulerLock(name = "outbox_poller_lock", lockAtMostFor = "1m", lockAtLeastFor = "5s")
    @Transactional
    public void pollAndDispatchDueJobs() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Process Outbox pending jobs
        List<OutboxJob> dueOutboxJobs = outboxJobRepository.findDueJobs(OutboxJobStatus.PENDING, now, PageRequest.of(0, 20));
        for (OutboxJob job : dueOutboxJobs) {
            job.setStatus(OutboxJobStatus.PROCESSING);
            outboxJobRepository.save(job);

            log.info("Outbox poller dispatched scheduled post ID: {}", job.getScheduledPostId());
            publishingWorker.executePublishing(job.getScheduledPostId());

            job.setStatus(OutboxJobStatus.COMPLETED);
            job.setProcessedAt(LocalDateTime.now());
            outboxJobRepository.save(job);
        }

        // 2. Poll due posts in SCHEDULED or FAILED_RETRYABLE status
        List<ScheduledPost> duePosts = scheduledPostRepository.findDuePosts(PostStatus.SCHEDULED, now);
        for (ScheduledPost post : duePosts) {
            post.setStatus(PostStatus.QUEUED);
            scheduledPostRepository.save(post);
            publishingWorker.executePublishing(post.getId());
        }

        // 3. Retry FAILED_RETRYABLE posts whose nextAttemptAt is due
        List<ScheduledPost> retryPosts = scheduledPostRepository.findDuePosts(PostStatus.FAILED_RETRYABLE, now);
        for (ScheduledPost post : retryPosts) {
            if (post.getNextAttemptAt() != null && post.getNextAttemptAt().isBefore(now)) {
                post.setStatus(PostStatus.QUEUED);
                scheduledPostRepository.save(post);
                publishingWorker.executePublishing(post.getId());
            }
        }
    }
}
