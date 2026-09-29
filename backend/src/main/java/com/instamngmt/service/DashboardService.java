package com.instamngmt.service;

import com.instamngmt.dto.DashboardDTOs;
import com.instamngmt.dto.InstagramDTOs;
import com.instamngmt.dto.PostDTOs;
import com.instamngmt.entity.PostStatus;
import com.instamngmt.entity.User;
import com.instamngmt.repository.ScheduledPostRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public DashboardDTOs.DashboardSummaryDTO getDashboardSummary(User user) {
        long totalPosts = scheduledPostRepository.countByUserIdAndStatus(user.getId(), PostStatus.SCHEDULED)
                + scheduledPostRepository.countByUserIdAndStatus(user.getId(), PostStatus.PUBLISHED)
                + scheduledPostRepository.countByUserIdAndStatus(user.getId(), PostStatus.FAILED_TERMINAL)
                + scheduledPostRepository.countByUserIdAndStatus(user.getId(), PostStatus.FAILED_RETRYABLE)
                + scheduledPostRepository.countByUserIdAndStatus(user.getId(), PostStatus.DRAFT);

        long scheduledCount = scheduledPostRepository.countByUserIdAndStatus(user.getId(), PostStatus.SCHEDULED)
                + scheduledPostRepository.countByUserIdAndStatus(user.getId(), PostStatus.QUEUED)
                + scheduledPostRepository.countByUserIdAndStatus(user.getId(), PostStatus.CREATING_CONTAINER)
                + scheduledPostRepository.countByUserIdAndStatus(user.getId(), PostStatus.CONTAINER_PROCESSING);

        long publishedCount = scheduledPostRepository.countByUserIdAndStatus(user.getId(), PostStatus.PUBLISHED);

        long failedCount = scheduledPostRepository.countByUserIdAndStatus(user.getId(), PostStatus.FAILED_TERMINAL)
                + scheduledPostRepository.countByUserIdAndStatus(user.getId(), PostStatus.FAILED_RETRYABLE);

        long draftCount = scheduledPostRepository.countByUserIdAndStatus(user.getId(), PostStatus.DRAFT);

        List<PostDTOs.ScheduledPostDTO> allPosts = postService.getUserPosts(user);
        List<PostDTOs.ScheduledPostDTO> upcomingPosts = allPosts.stream().limit(5).toList();

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
