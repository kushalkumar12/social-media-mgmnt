package com.instamngmt.util;

import com.instamngmt.entity.MediaType;
import com.instamngmt.exception.APIException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class MediaValidator {

    public void validateMedia(MediaType type, String contentType, long size, Integer width, Integer height, Double durationSeconds) {
        if (size > 100 * 1024 * 1024) { // 100 MB max limit
            throw new APIException(HttpStatus.BAD_REQUEST, "FILE_TOO_LARGE", "File size exceeds 100MB max limit");
        }

        if (type == MediaType.IMAGE || type == MediaType.CAROUSEL_ITEM) {
            if (contentType != null && !contentType.startsWith("image/")) {
                throw new APIException(HttpStatus.BAD_REQUEST, "INVALID_MEDIA_TYPE", "File must be an image (JPEG/PNG)");
            }
            if (width != null && height != null && height > 0) {
                double aspectRatio = (double) width / height;
                // Meta aspect ratio rule: between 0.8 (4:5) and 1.91 (1.91:1)
                if (aspectRatio < 0.75 || aspectRatio > 2.0) {
                    throw new APIException(HttpStatus.BAD_REQUEST, "INVALID_ASPECT_RATIO",
                            String.format("Image aspect ratio (%.2f) must be between 4:5 (0.80) and 1.91:1 (1.91)", aspectRatio));
                }
            }
        } else if (type == MediaType.VIDEO || type == MediaType.REELS) {
            if (contentType != null && !contentType.startsWith("video/")) {
                throw new APIException(HttpStatus.BAD_REQUEST, "INVALID_MEDIA_TYPE", "File must be a video (MP4/MOV)");
            }
            if (type == MediaType.REELS && durationSeconds != null) {
                if (durationSeconds < 3.0 || durationSeconds > 90.0) {
                    throw new APIException(HttpStatus.BAD_REQUEST, "INVALID_REEL_DURATION", "Reels video duration must be between 3 seconds and 90 seconds");
                }
            }
        }
    }
}
