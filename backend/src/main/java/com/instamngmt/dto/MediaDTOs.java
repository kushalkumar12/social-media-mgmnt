package com.instamngmt.dto;

import com.instamngmt.entity.MediaType;
import lombok.*;

import java.time.LocalDateTime;

public class MediaDTOs {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MediaDTO {
        private Long id;
        private String fileName;
        private MediaType mediaType;
        private String cdnUrl;
        private Long fileSize;
        private String mimeType;
        private Integer width;
        private Integer height;
        private Double durationSeconds;
        private String codec;
        private Double aspectRatio;
        private LocalDateTime createdAt;
    }
}
