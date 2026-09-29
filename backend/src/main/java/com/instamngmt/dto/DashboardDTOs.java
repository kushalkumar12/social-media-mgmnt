package com.instamngmt.dto;

import lombok.*;

import java.util.List;

public class DashboardDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardSummaryDTO {
        private long totalPosts;
        private long scheduledCount;
        private long publishedCount;
        private long failedCount;
        private long draftCount;
        private List<PostDTOs.ScheduledPostDTO> upcomingPosts;
        private List<InstagramDTOs.InstagramAccountDTO> accounts;
    }
}
