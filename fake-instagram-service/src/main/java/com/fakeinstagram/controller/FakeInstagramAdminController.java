package com.fakeinstagram.controller;

import com.fakeinstagram.dto.*;
import com.fakeinstagram.entity.FakeAccount;
import com.fakeinstagram.entity.FakeToken;
import com.fakeinstagram.repository.FakeTokenRepository;
import com.fakeinstagram.service.FakeAccountService;
import com.fakeinstagram.service.FakeTokenService;
import com.fakeinstagram.service.SimulationStateService;
import com.fakeinstagram.service.TestDataGeneratorService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*")
public class FakeInstagramAdminController {

    private final TestDataGeneratorService testDataGeneratorService;
    private final FakeAccountService fakeAccountService;
    private final FakeTokenService fakeTokenService;
    private final FakeTokenRepository fakeTokenRepository;
    private final SimulationStateService simulationStateService;

    public FakeInstagramAdminController(
            TestDataGeneratorService testDataGeneratorService,
            FakeAccountService fakeAccountService,
            FakeTokenService fakeTokenService,
            FakeTokenRepository fakeTokenRepository,
            SimulationStateService simulationStateService) {
        this.testDataGeneratorService = testDataGeneratorService;
        this.fakeAccountService = fakeAccountService;
        this.fakeTokenService = fakeTokenService;
        this.fakeTokenRepository = fakeTokenRepository;
        this.simulationStateService = simulationStateService;
    }

    // ==========================================
    // 1. BULK TEST DATA GENERATION
    // ==========================================

    @PostMapping("/test-data/accounts/generate")
    public ResponseEntity<?> generateAccounts(@RequestBody(required = false) AccountGenerateRequest request) {
        if (request == null) request = new AccountGenerateRequest();
        Map<String, Object> result = testDataGeneratorService.generateAccounts(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/test-data/posts/generate")
    public ResponseEntity<?> generatePosts(@RequestBody(required = false) PostGenerateRequest request) {
        if (request == null) request = new PostGenerateRequest();
        Map<String, Object> result = testDataGeneratorService.generatePosts(request);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/test-data/reset")
    public ResponseEntity<?> resetAllTestData() {
        testDataGeneratorService.resetAllData();
        simulationStateService.resetToDefaults();
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", "All simulator accounts, tokens, posts, containers, and metrics have been reset.");
        return ResponseEntity.ok(resp);
    }

    // ==========================================
    // 2. ACCOUNT MANAGEMENT & PAGINATION
    // ==========================================

    @GetMapping("/accounts")
    public ResponseEntity<?> getAccounts(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<FakeAccount> accountPage = fakeAccountService.searchAccounts(
                query, PageRequest.of(page, Math.min(size, 200), Sort.by(Sort.Direction.DESC, "id"))
        );

        // Fetch tokens for these accounts
        List<Map<String, Object>> content = new ArrayList<>();
        for (FakeAccount acc : accountPage.getContent()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", acc.getId());
            item.put("igUserId", acc.getIgUserId());
            item.put("username", acc.getUsername());
            item.put("name", acc.getName());
            item.put("profilePictureUrl", acc.getProfilePictureUrl());
            item.put("followersCount", acc.getFollowersCount());
            item.put("followingCount", acc.getFollowingCount());
            item.put("mediaCount", acc.getMediaCount());
            item.put("biography", acc.getBiography());
            item.put("accountType", acc.getAccountType());
            item.put("status", acc.getStatus());

            List<FakeToken> tokens = fakeTokenRepository.findByIgUserId(acc.getIgUserId());
            if (!tokens.isEmpty()) {
                FakeToken token = tokens.get(0);
                item.put("activeToken", token.getToken());
                item.put("tokenStatus", token.getStatus());
            } else {
                item.put("activeToken", null);
                item.put("tokenStatus", "NONE");
            }
            content.add(item);
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("content", content);
        resp.put("page", accountPage.getNumber());
        resp.put("size", accountPage.getSize());
        resp.put("totalElements", accountPage.getTotalElements());
        resp.put("totalPages", accountPage.getTotalPages());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/accounts/{id}")
    public ResponseEntity<?> getAccountById(@PathVariable Long id) {
        return fakeAccountService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/accounts")
    public ResponseEntity<?> createAccount(@RequestBody FakeAccount account) {
        FakeAccount created = fakeAccountService.createAccount(account);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/accounts/{id}")
    public ResponseEntity<?> deleteAccount(@PathVariable Long id) {
        fakeAccountService.deleteAccount(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Account deleted successfully."));
    }

    // ==========================================
    // 3. TOKEN LIFECYCLE CONTROLS
    // ==========================================

    @PostMapping("/tokens/{token}/expire")
    public ResponseEntity<?> expireToken(@PathVariable String token) {
        boolean ok = fakeTokenService.expireToken(token);
        return ResponseEntity.ok(Map.of("success", ok, "token", token, "status", "EXPIRED"));
    }

    @PostMapping("/tokens/{token}/revoke")
    public ResponseEntity<?> revokeToken(@PathVariable String token) {
        boolean ok = fakeTokenService.revokeToken(token);
        return ResponseEntity.ok(Map.of("success", ok, "token", token, "status", "REVOKED"));
    }

    @PostMapping("/tokens/{token}/restore")
    public ResponseEntity<?> restoreToken(@PathVariable String token) {
        boolean ok = fakeTokenService.restoreToken(token);
        return ResponseEntity.ok(Map.of("success", ok, "token", token, "status", "VALID"));
    }

    @GetMapping("/tokens/user/{igUserId}")
    public ResponseEntity<?> getTokensForUser(@PathVariable String igUserId) {
        return ResponseEntity.ok(fakeTokenRepository.findByIgUserId(igUserId));
    }

    // ==========================================
    // 4. SIMULATION CONFIGURATION
    // ==========================================

    @GetMapping("/simulation/config")
    public ResponseEntity<?> getSimulationConfig() {
        return ResponseEntity.ok(simulationStateService.getCurrentConfig());
    }

    @PostMapping("/simulation/config")
    public ResponseEntity<?> updateSimulationConfig(@RequestBody SimulationConfigRequest config) {
        simulationStateService.updateConfig(config);
        return ResponseEntity.ok(simulationStateService.getCurrentConfig());
    }

    @PostMapping("/simulation/latency")
    public ResponseEntity<?> setLatency(@RequestBody Map<String, Object> body) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        int minMs = body.containsKey("minMs") ? ((Number) body.get("minMs")).intValue() : 500;
        int maxMs = body.containsKey("maxMs") ? ((Number) body.get("maxMs")).intValue() : minMs;

        simulationStateService.updateConfig(SimulationConfigRequest.builder()
                .latencyEnabled(enabled)
                .minLatencyMs(minMs)
                .maxLatencyMs(maxMs)
                .build());
        return ResponseEntity.ok(simulationStateService.getCurrentConfig());
    }

    @PostMapping("/simulation/rate-limit")
    public ResponseEntity<?> setRateLimit(@RequestBody Map<String, Object> body) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        int maxPerMin = body.containsKey("maxRequestsPerMinute") ? ((Number) body.get("maxRequestsPerMinute")).intValue() : 60;

        simulationStateService.updateConfig(SimulationConfigRequest.builder()
                .rateLimitEnabled(enabled)
                .maxRequestsPerMinute(maxPerMin)
                .build());
        return ResponseEntity.ok(simulationStateService.getCurrentConfig());
    }

    @PostMapping("/simulation/force-error")
    public ResponseEntity<?> forceError(@RequestBody Map<String, Object> body) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        int status = body.containsKey("statusCode") ? ((Number) body.get("statusCode")).intValue() : 500;
        int code = body.containsKey("errorCode") ? ((Number) body.get("errorCode")).intValue() : 2;
        String msg = (String) body.getOrDefault("errorMessage", "Simulated service outage");

        simulationStateService.updateConfig(SimulationConfigRequest.builder()
                .forcedErrorEnabled(enabled)
                .forcedStatusCode(status)
                .forcedErrorCode(code)
                .forcedErrorMessage(msg)
                .build());
        return ResponseEntity.ok(simulationStateService.getCurrentConfig());
    }

    @PostMapping("/simulation/reset")
    public ResponseEntity<?> resetSimulationConfig() {
        simulationStateService.resetToDefaults();
        return ResponseEntity.ok(simulationStateService.getCurrentConfig());
    }

    // ==========================================
    // 5. PREDEFINED TEST SCENARIOS
    // ==========================================

    @PostMapping("/scenarios/{scenarioName}")
    public ResponseEntity<?> applyScenario(@PathVariable String scenarioName) {
        String scenario = scenarioName.toUpperCase();
        simulationStateService.resetToDefaults();
        simulationStateService.setActiveScenario(scenario);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("scenario", scenario);

        switch (scenario) {
            case "NORMAL" -> {
                response.put("description", "Normal operational conditions: no latency, no rate limits, valid tokens.");
            }
            case "LARGE_DATASET" -> {
                Map<String, Object> gen = testDataGeneratorService.generateAccounts(AccountGenerateRequest.builder()
                        .count(10000)
                        .generatePosts(true)
                        .postsPerAccount(5)
                        .generateFollowers(true)
                        .minFollowers(100)
                        .maxFollowers(500000)
                        .randomizeNames(true)
                        .build());
                response.put("dataGenerated", gen);
                response.put("description", "10,000 accounts and 50,000 posts generated successfully.");
            }
            case "EXTREME_DATASET" -> {
                Map<String, Object> gen = testDataGeneratorService.generateAccounts(AccountGenerateRequest.builder()
                        .count(20000)
                        .generatePosts(true)
                        .postsPerAccount(5)
                        .generateFollowers(true)
                        .minFollowers(50)
                        .maxFollowers(1000000)
                        .randomizeNames(true)
                        .build());
                response.put("dataGenerated", gen);
                response.put("description", "20,000 accounts and 100,000 posts generated successfully.");
            }
            case "SLOW_API" -> {
                simulationStateService.updateConfig(SimulationConfigRequest.builder()
                        .latencyEnabled(true)
                        .minLatencyMs(2000)
                        .maxLatencyMs(5000)
                        .build());
                response.put("description", "High latency enabled: 2,000ms – 5,000ms simulated network delay per request.");
            }
            case "RATE_LIMITED" -> {
                simulationStateService.updateConfig(SimulationConfigRequest.builder()
                        .rateLimitEnabled(true)
                        .maxRequestsPerMinute(5)
                        .build());
                response.put("description", "Aggressive rate limiting enabled: Max 5 requests per minute (HTTP 429).");
            }
            case "TOKEN_FAILURE" -> {
                simulationStateService.setActiveScenario("TOKEN_FAILURE");
                response.put("description", "Token failure simulated: All requests will fail with OAuthException code 190 (expired token).");
            }
            case "SERVER_FAILURE" -> {
                simulationStateService.updateConfig(SimulationConfigRequest.builder()
                        .forcedErrorEnabled(true)
                        .forcedStatusCode(500)
                        .forcedErrorCode(2)
                        .forcedErrorMessage("Meta Graph API internal 500 error: Service temporarily unavailable.")
                        .build());
                response.put("description", "Server outage simulated: All requests will return HTTP 500 Internal Server Error.");
            }
            case "EMPTY_DATA" -> {
                testDataGeneratorService.resetAllData();
                response.put("description", "All accounts, posts, containers, and tokens have been wiped out.");
            }
            default -> {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Unknown scenario: " + scenarioName + ". Valid scenarios: NORMAL, LARGE_DATASET, EXTREME_DATASET, SLOW_API, RATE_LIMITED, TOKEN_FAILURE, SERVER_FAILURE, EMPTY_DATA"
                ));
            }
        }

        response.put("activeConfig", simulationStateService.getCurrentConfig());
        return ResponseEntity.ok(response);
    }

    // ==========================================
    // 6. STATISTICS & TELEMETRY
    // ==========================================

    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> getStats() {
        return ResponseEntity.ok(fakeAccountService.getStats());
    }
}
