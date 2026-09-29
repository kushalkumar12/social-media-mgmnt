package com.fakeinstagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationConfigRequest {
    private Boolean latencyEnabled;
    private Integer minLatencyMs;
    private Integer maxLatencyMs;

    private Boolean rateLimitEnabled;
    private Integer maxRequestsPerMinute;

    private Boolean forcedErrorEnabled;
    private Integer forcedStatusCode;
    private Integer forcedErrorCode;
    private String forcedErrorMessage;

    private Boolean tokenValidationStrict;
    private String activeScenario;
}
