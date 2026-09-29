package com.instamngmt.service;

import org.springframework.stereotype.Service;

@Service
public class ErrorTaxonomyService {

    public boolean isRetryable(Integer httpStatus, String metaErrorCode) {
        if (httpStatus == null) return true;

        // 5xx Server Errors are transient & retryable
        if (httpStatus >= 500) {
            return true;
        }

        // Rate limit 429 is retryable with backoff
        if (httpStatus == 429) {
            return true;
        }

        if (metaErrorCode != null) {
            switch (metaErrorCode) {
                case "4": // Application level rate limit
                case "17": // User level rate limit
                case "32": // Page rate limit
                case "613": // Calls to this api have been exceeded
                case "CONTAINER_IN_PROGRESS": // Container still processing
                case "TIMEOUT":
                    return true;

                case "100": // Invalid parameter
                case "190": // Invalid access token / expired
                case "200": // Permission error
                case "10": // Permission denied
                case "368": // Temporarily blocked for policy violation
                case "CONTAINER_EXPIRED":
                    return false;
            }
        }

        // 4xx errors are generally terminal unless rate-limited
        return httpStatus < 400 || httpStatus == 429;
    }
}
