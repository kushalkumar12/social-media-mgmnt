package com.fakeinstagram.service;

import com.fakeinstagram.dto.SimulationConfigRequest;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class SimulationStateService {

    // Latency controls
    private final AtomicBoolean latencyEnabled = new AtomicBoolean(false);
    private final AtomicInteger minLatencyMs = new AtomicInteger(500);
    private final AtomicInteger maxLatencyMs = new AtomicInteger(1500);

    // Rate limiting controls
    private final AtomicBoolean rateLimitEnabled = new AtomicBoolean(false);
    private final AtomicInteger maxRequestsPerMinute = new AtomicInteger(60);
    private final ConcurrentLinkedQueue<Long> requestTimestamps = new ConcurrentLinkedQueue<>();

    // Error injection controls
    private final AtomicBoolean forcedErrorEnabled = new AtomicBoolean(false);
    private final AtomicInteger forcedStatusCode = new AtomicInteger(500);
    private final AtomicInteger forcedErrorCode = new AtomicInteger(2);
    private volatile String forcedErrorMessage = "Temporary Meta API service outage. Please retry.";

    // Token validation strictness
    private final AtomicBoolean tokenValidationStrict = new AtomicBoolean(true);

    // Active scenario name
    private volatile String activeScenario = "NORMAL";

    // Telemetry & metrics
    private final AtomicLong totalApiRequests = new AtomicLong(0);
    private final AtomicLong totalErrorResponses = new AtomicLong(0);
    private final AtomicLong totalLatencyAccumulatedMs = new AtomicLong(0);

    public boolean isLatencyEnabled() {
        return latencyEnabled.get();
    }

    public int getMinLatencyMs() {
        return minLatencyMs.get();
    }

    public int getMaxLatencyMs() {
        return maxLatencyMs.get();
    }

    public int computeSimulatedLatency() {
        if (!latencyEnabled.get()) return 0;
        int min = Math.max(0, minLatencyMs.get());
        int max = Math.max(min, maxLatencyMs.get());
        if (min == max) return min;
        return min + (int) (Math.random() * (max - min + 1));
    }

    public boolean isRateLimitEnabled() {
        return rateLimitEnabled.get();
    }

    public int getMaxRequestsPerMinute() {
        return maxRequestsPerMinute.get();
    }

    /**
     * Checks if current request violates rate limit sliding window.
     * @return true if allowed, false if limit exceeded.
     */
    public boolean checkRateLimit() {
        if (!rateLimitEnabled.get()) {
            return true;
        }

        long now = System.currentTimeMillis();
        long windowStart = now - 60_000L;

        // Evict expired entries
        while (!requestTimestamps.isEmpty() && requestTimestamps.peek() < windowStart) {
            requestTimestamps.poll();
        }

        if (requestTimestamps.size() >= maxRequestsPerMinute.get()) {
            return false;
        }

        requestTimestamps.add(now);
        return true;
    }

    public boolean isForcedErrorEnabled() {
        return forcedErrorEnabled.get();
    }

    public int getForcedStatusCode() {
        return forcedStatusCode.get();
    }

    public int getForcedErrorCode() {
        return forcedErrorCode.get();
    }

    public String getForcedErrorMessage() {
        return forcedErrorMessage;
    }

    public boolean isTokenValidationStrict() {
        return tokenValidationStrict.get();
    }

    public String getActiveScenario() {
        return activeScenario;
    }

    public void setActiveScenario(String activeScenario) {
        this.activeScenario = activeScenario;
    }

    public void recordRequest(long durationMs, boolean isError) {
        totalApiRequests.incrementAndGet();
        totalLatencyAccumulatedMs.addAndGet(durationMs);
        if (isError) {
            totalErrorResponses.incrementAndGet();
        }
    }

    public long getTotalApiRequests() {
        return totalApiRequests.get();
    }

    public long getTotalErrorResponses() {
        return totalErrorResponses.get();
    }

    public double getAverageLatencyMs() {
        long count = totalApiRequests.get();
        return count == 0 ? 0.0 : (double) totalLatencyAccumulatedMs.get() / count;
    }

    public synchronized void updateConfig(SimulationConfigRequest config) {
        if (config.getLatencyEnabled() != null) latencyEnabled.set(config.getLatencyEnabled());
        if (config.getMinLatencyMs() != null) minLatencyMs.set(config.getMinLatencyMs());
        if (config.getMaxLatencyMs() != null) maxLatencyMs.set(config.getMaxLatencyMs());

        if (config.getRateLimitEnabled() != null) rateLimitEnabled.set(config.getRateLimitEnabled());
        if (config.getMaxRequestsPerMinute() != null) maxRequestsPerMinute.set(config.getMaxRequestsPerMinute());

        if (config.getForcedErrorEnabled() != null) forcedErrorEnabled.set(config.getForcedErrorEnabled());
        if (config.getForcedStatusCode() != null) forcedStatusCode.set(config.getForcedStatusCode());
        if (config.getForcedErrorCode() != null) forcedErrorCode.set(config.getForcedErrorCode());
        if (config.getForcedErrorMessage() != null) forcedErrorMessage = config.getForcedErrorMessage();

        if (config.getTokenValidationStrict() != null) tokenValidationStrict.set(config.getTokenValidationStrict());
        if (config.getActiveScenario() != null) activeScenario = config.getActiveScenario();
    }

    public synchronized void resetToDefaults() {
        latencyEnabled.set(false);
        minLatencyMs.set(500);
        maxLatencyMs.set(1500);

        rateLimitEnabled.set(false);
        maxRequestsPerMinute.set(60);
        requestTimestamps.clear();

        forcedErrorEnabled.set(false);
        forcedStatusCode.set(500);
        forcedErrorCode.set(2);
        forcedErrorMessage = "Temporary Meta API service outage. Please retry.";

        tokenValidationStrict.set(true);
        activeScenario = "NORMAL";
    }

    public SimulationConfigRequest getCurrentConfig() {
        return SimulationConfigRequest.builder()
                .latencyEnabled(latencyEnabled.get())
                .minLatencyMs(minLatencyMs.get())
                .maxLatencyMs(maxLatencyMs.get())
                .rateLimitEnabled(rateLimitEnabled.get())
                .maxRequestsPerMinute(maxRequestsPerMinute.get())
                .forcedErrorEnabled(forcedErrorEnabled.get())
                .forcedStatusCode(forcedStatusCode.get())
                .forcedErrorCode(forcedErrorCode.get())
                .forcedErrorMessage(forcedErrorMessage)
                .tokenValidationStrict(tokenValidationStrict.get())
                .activeScenario(activeScenario)
                .build();
    }
}
