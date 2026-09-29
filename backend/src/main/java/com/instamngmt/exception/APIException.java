package com.instamngmt.exception;

import org.springframework.http.HttpStatus;

public class APIException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public APIException(HttpStatus status, String message) {
        super(message);
        this.status = status;
        this.errorCode = status.name();
    }

    public APIException(HttpStatus status, String errorCode, String message) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
