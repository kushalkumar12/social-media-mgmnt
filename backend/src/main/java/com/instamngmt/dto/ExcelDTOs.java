package com.instamngmt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ExcelDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExcelRowPreview {
        private int rowIndex;
        private String name;
        private String caption;
        private String scheduledTimeStr;
        private LocalDateTime scheduledTime;
        private String mediaUrl;
        private String postType;
        private String location;
        private Long instagramAccountId;
        @Builder.Default
        private boolean valid = true;
        @Builder.Default
        private List<String> validationErrors = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExcelUploadResponse {
        private Long batchId;
        private String fileName;
        private int totalRows;
        private int validRows;
        private int errorRows;
        private List<ExcelRowPreview> rows;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommitBatchRequest {
        private Long batchId;
        private Long defaultInstagramAccountId;
        private List<Integer> selectedRowIndices; // if null/empty, commits all valid rows
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommitBatchResponse {
        private Long batchId;
        private int committedCount;
        private String message;
    }
}
