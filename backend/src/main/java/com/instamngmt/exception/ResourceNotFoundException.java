package com.instamngmt.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends APIException {

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
    }
}
