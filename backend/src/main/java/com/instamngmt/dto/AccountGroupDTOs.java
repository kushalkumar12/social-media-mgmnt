package com.instamngmt.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

public class AccountGroupDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GroupDTO {
        private Long id;
        private String groupName;
        private String status;
        private int memberCount;
        private int inactiveCount;
        private Set<Long> accountIds;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateGroupRequest {
        @NotBlank(message = "Group name is required")
        private String groupName;
        private String status; // ACTIVE / INACTIVE
        private Set<Long> accountIds;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateGroupRequest {
        private String groupName;
        private String status;
        private Set<Long> accountIds;
    }
}
