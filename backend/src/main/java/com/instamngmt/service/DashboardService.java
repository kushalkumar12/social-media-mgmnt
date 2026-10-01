package com.instamngmt.service;

import com.instamngmt.dto.DashboardDTOs;
import com.instamngmt.dto.InstagramDTOs;
import com.instamngmt.dto.PostDTOs;
import com.instamngmt.entity.PostStatus;
import com.instamngmt.entity.User;
import com.instamngmt.repository.ScheduledPostRepository;
import org.springframework.stereotype.Service;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final ScheduledPostRepository scheduledPostRepository;
    private final PostService postService;
    private final InstagramAuthService instagramAuthService;

    public DashboardService(
            ScheduledPostRepository scheduledPostRepository,
            PostService postService,
            InstagramAuthService instagramAuthService) {
        this.scheduledPostRepository = scheduledPostRepository;
        this.postService = postService;
        this.instagramAuthService = instagramAuthService;
    }

    @Transactional(readOnly = true)
    public DashboardDTOs.DashboardSummaryDTO getDashboardSummary(User user) {
        // High-performance single-pass status grouping aggregation (backed by index)
        List<Object[]> statusCounts = scheduledPostRepository.countPostsByStatusForUser(user.getId());
        Map<PostStatus, Long> countsMap = new EnumMap<>(PostStatus.class);
        long totalPosts = 0;

        for (Object[] row : statusCounts) {
            PostStatus status = (PostStatus) row[0];
            long count = ((Number) row[1]).longValue();
            countsMap.put(status, count);
            totalPosts += count;
        }

        long scheduledCount = countsMap.getOrDefault(PostStatus.SCHEDULED, 0L)
                + countsMap.getOrDefault(PostStatus.QUEUED, 0L)
                + countsMap.getOrDefault(PostStatus.CREATING_CONTAINER, 0L)
                + countsMap.getOrDefault(PostStatus.CONTAINER_PROCESSING, 0L);

        long publishedCount = countsMap.getOrDefault(PostStatus.PUBLISHED, 0L);

        long failedCount = countsMap.getOrDefault(PostStatus.FAILED_TERMINAL, 0L)
                + countsMap.getOrDefault(PostStatus.FAILED_RETRYABLE, 0L);

        long draftCount = countsMap.getOrDefault(PostStatus.DRAFT, 0L);

        // Fetch ONLY top 5 upcoming posts directly from database with LIMIT 5 and JOIN FETCH
        List<PostDTOs.ScheduledPostDTO> upcomingPosts = postService.getUpcomingPosts(user, 5);

        List<InstagramDTOs.InstagramAccountDTO> accounts = instagramAuthService.getUserAccounts(user);

        return DashboardDTOs.DashboardSummaryDTO.builder()
                .totalPosts(totalPosts)
                .scheduledCount(scheduledCount)
                .publishedCount(publishedCount)
                .failedCount(failedCount)
                .draftCount(draftCount)
                .upcomingPosts(upcomingPosts)
                .accounts(accounts)
                .build();
    }
}
