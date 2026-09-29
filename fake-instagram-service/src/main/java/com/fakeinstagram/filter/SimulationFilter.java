package com.fakeinstagram.filter;

import com.fakeinstagram.dto.MetaErrorResponse;
import com.fakeinstagram.service.SimulationStateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SimulationFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(SimulationFilter.class);

    private final SimulationStateService simulationStateService;
    private final ObjectMapper objectMapper;

    public SimulationFilter(SimulationStateService simulationStateService, ObjectMapper objectMapper) {
        this.simulationStateService = simulationStateService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        String uri = request.getRequestURI();

        // Bypass admin endpoints, health actuator, h2-console, and static files from simulation interference
        if (uri.startsWith("/admin") || uri.startsWith("/h2-console") || uri.startsWith("/actuator")
                || uri.endsWith(".html") || uri.endsWith(".css") || uri.endsWith(".js") || uri.endsWith(".ico")
                || uri.equals("/") || uri.equals("/favicon.ico")) {
            filterChain.doFilter(servletRequest, servletResponse);
            return;
        }

        long startTime = System.currentTimeMillis();
        boolean isError = false;

        try {
            // 1. Rate Limiting Check
            if (simulationStateService.isRateLimitEnabled() && !simulationStateService.checkRateLimit()) {
                log.warn("Rate limit exceeded for request URI: {}", uri);
                isError = true;
                response.setStatus(429);
                response.setContentType("application/json");
                response.setHeader("Retry-After", "60");
                response.setHeader("X-App-Usage", "{\"call_count\":100,\"total_cputime\":100,\"total_time\":100}");
                response.setHeader("X-Business-Use-Case-Usage", "{\"123456\":[{\"call_count\":100,\"total_cputime\":100,\"total_time\":100,\"type\":\"pages\"}]}");
                response.getWriter().write(objectMapper.writeValueAsString(MetaErrorResponse.rateLimitExceeded()));
                return;
            }

            // 2. Forced Error Simulation
            if (simulationStateService.isForcedErrorEnabled()) {
                int status = simulationStateService.getForcedStatusCode();
                int errCode = simulationStateService.getForcedErrorCode();
                String errMsg = simulationStateService.getForcedErrorMessage();

                log.warn("Simulating forced error status {} with code {}: {}", status, errCode, errMsg);
                isError = true;
                response.setStatus(status);
                response.setContentType("application/json");
                response.getWriter().write(objectMapper.writeValueAsString(
                        MetaErrorResponse.generic(errCode, errMsg, status >= 500 ? "ServerException" : "OAuthException")
                ));
                return;
            }

            // 3. Simulated Network Latency
            int latency = simulationStateService.computeSimulatedLatency();
            if (latency > 0) {
                try {
                    Thread.sleep(latency);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            }

            // Proceed with downstream filter/controller
            filterChain.doFilter(servletRequest, servletResponse);

            if (response.getStatus() >= 400) {
                isError = true;
            }

        } finally {
            long duration = System.currentTimeMillis() - startTime;
            simulationStateService.recordRequest(duration, isError);
        }
    }
}
