package com.fakeinstagram.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MetaErrorResponse {

    private ErrorDetail error;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetail {
        private String message;
        private String type;
        private Integer code;
        private Integer error_subcode;
        private String fbtrace_id;

        public static ErrorDetail of(String message, String type, int code, Integer subcode) {
            return ErrorDetail.builder()
                    .message(message)
                    .type(type)
                    .code(code)
                    .error_subcode(subcode)
                    .fbtrace_id(UUID.randomUUID().toString().replace("-", "").substring(0, 16))
                    .build();
        }
    }

    public static MetaErrorResponse tokenExpired() {
        return MetaErrorResponse.builder()
                .error(ErrorDetail.of(
                        "Error validating access token: Session has expired or token is invalid.",
                        "OAuthException",
                        190,
                        463
                ))
                .build();
    }

    public static MetaErrorResponse tokenRevoked() {
        return MetaErrorResponse.builder()
                .error(ErrorDetail.of(
                        "Error validating access token: User has revoked access or session was invalidated.",
                        "OAuthException",
                        190,
                        458
                ))
                .build();
    }

    public static MetaErrorResponse rateLimitExceeded() {
        return MetaErrorResponse.builder()
                .error(ErrorDetail.of(
                        "(#4) Application request limit reached",
                        "OAuthException",
                        4,
                        null
                ))
                .build();
    }

    public static MetaErrorResponse notFound(String message) {
        return MetaErrorResponse.builder()
                .error(ErrorDetail.of(
                        message != null ? message : "Unsupported get request. Object with ID does not exist.",
                        "GraphMethodException",
                        100,
                        33
                ))
                .build();
    }

    public static MetaErrorResponse generic(int code, String message, String type) {
        return MetaErrorResponse.builder()
                .error(ErrorDetail.of(
                        message,
                        type != null ? type : "OAuthException",
                        code,
                        null
                ))
                .build();
    }
}
