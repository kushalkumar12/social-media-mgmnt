package com.fakeinstagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatsResponse {
    private long totalAccounts;
    private long totalTokens;
    private long totalActiveTokens;
    private long totalExpiredTokens;
    private long totalContainers;
    private long totalPublishedMedia;
    private long totalComments;
    private long totalApiRequests;
    private long totalErrorResponses;
    private double averageLatencyMs;
    private String activeScenario;
    private SimulationConfigRequest activeSimulationConfig;
}
