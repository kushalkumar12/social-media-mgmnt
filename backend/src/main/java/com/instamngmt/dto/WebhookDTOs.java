package com.instamngmt.dto;

import lombok.*;

public class WebhookDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DataDeletionResponse {
        private String url;
        private String confirmationCode;
    }
}
