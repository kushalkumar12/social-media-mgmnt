package com.fakeinstagram;

import com.fakeinstagram.dto.AccountGenerateRequest;
import com.fakeinstagram.dto.PostGenerateRequest;
import com.fakeinstagram.dto.SimulationConfigRequest;
import com.fakeinstagram.entity.FakeAccount;
import com.fakeinstagram.entity.FakeToken;
import com.fakeinstagram.repository.FakeAccountRepository;
import com.fakeinstagram.repository.FakeTokenRepository;
import com.fakeinstagram.service.FakeAccountService;
import com.fakeinstagram.service.FakeMediaService;
import com.fakeinstagram.service.FakeTokenService;
import com.fakeinstagram.service.SimulationStateService;
import com.fakeinstagram.service.TestDataGeneratorService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class FakeInstagramSimulatorTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TestDataGeneratorService testDataGeneratorService;

    @Autowired
    private FakeAccountRepository fakeAccountRepository;

    @Autowired
    private FakeTokenRepository fakeTokenRepository;

    @Autowired
    private FakeAccountService fakeAccountService;

    @Autowired
    private FakeMediaService fakeMediaService;

    @Autowired
    private FakeTokenService fakeTokenService;

    @Autowired
    private SimulationStateService simulationStateService;

    @BeforeEach
    void setup() {
        simulationStateService.resetToDefaults();
    }

    @Test
    @DisplayName("1. Bulk Account Generation with Unique IDs and Usernames")
    void testBulkAccountGeneration() {
        AccountGenerateRequest req = AccountGenerateRequest.builder()
                .count(500)
                .generatePosts(true)
                .postsPerAccount(2)
                .generateFollowers(true)
                .minFollowers(100)
                .maxFollowers(5000)
                .randomizeNames(true)
                .build();

        long startTime = System.currentTimeMillis();
        Map<String, Object> result = testDataGeneratorService.generateAccounts(req);
        long elapsed = System.currentTimeMillis() - startTime;

        assertTrue((Boolean) result.get("success"));
        assertEquals(500, result.get("generatedAccounts"));
        assertTrue(elapsed < 5000, "500 accounts should be generated in under 5 seconds (took " + elapsed + " ms)");

        // Verify uniqueness of generated IDs and Usernames
        Page<FakeAccount> page = fakeAccountRepository.findAll(PageRequest.of(0, 500));
        Set<String> ids = new HashSet<>();
        Set<String> usernames = new HashSet<>();
        for (FakeAccount acc : page.getContent()) {
            assertTrue(ids.add(acc.getIgUserId()), "Duplicate account ID found: " + acc.getIgUserId());
            assertTrue(usernames.add(acc.getUsername()), "Duplicate username found: " + acc.getUsername());
        }
    }

    @Test
    @DisplayName("2. Account Retrieval via Graph API /v23.0/{id}")
    void testAccountRetrievalEndpoint() throws Exception {
        // Ensure at least one account exists
        FakeAccount account = fakeAccountRepository.findAll().stream().findFirst().orElseGet(() -> {
            return fakeAccountService.createAccount(FakeAccount.builder()
                    .igUserId("17841499999999999")
                    .username("test_creator_unit")
                    .name("Unit Creator")
                    .followersCount(5000)
                    .followingCount(300)
                    .mediaCount(10)
                    .build());
        });

        FakeToken token = fakeTokenRepository.findByIgUserId(account.getIgUserId()).stream().findFirst().orElseGet(() -> {
            FakeToken t = FakeToken.builder()
                    .token("EAAG_test_unit_token_" + account.getIgUserId())
                    .igUserId(account.getIgUserId())
                    .status("VALID")
                    .build();
            return fakeTokenRepository.save(t);
        });

        String response = mockMvc.perform(get("/v23.0/" + account.getIgUserId())
                        .param("access_token", token.getToken())
                        .param("fields", "id,username,name,followers_count,follows_count,media_count,biography"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode node = objectMapper.readTree(response);
        assertEquals(account.getIgUserId(), node.get("id").asText());
        assertEquals(account.getUsername(), node.get("username").asText());
        assertTrue(node.has("followers_count"));
    }

    @Test
    @DisplayName("3. Account Retrieval via Graph API /v23.0/me")
    void testMeEndpoint() throws Exception {
        FakeAccount account = fakeAccountRepository.findAll().stream().findFirst().orElseThrow();
        FakeToken token = fakeTokenRepository.findByIgUserId(account.getIgUserId()).stream().findFirst().orElseThrow();

        String response = mockMvc.perform(get("/v23.0/me")
                        .param("access_token", token.getToken())
                        .param("fields", "id,username,account_type"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode node = objectMapper.readTree(response);
        assertEquals(account.getIgUserId(), node.get("id").asText());
        assertEquals(account.getUsername(), node.get("username").asText());
    }

    @Test
    @DisplayName("4. Container Creation, Polling Status, and Media Publishing Lifecycle")
    void testMediaContainerAndPublishFlow() throws Exception {
        FakeAccount account = fakeAccountRepository.findAll().stream().findFirst().orElseThrow();
        FakeToken token = fakeTokenRepository.findByIgUserId(account.getIgUserId()).stream().findFirst().orElseThrow();

        // 1. Create Container
        String createResp = mockMvc.perform(post("/v23.0/" + account.getIgUserId() + "/media")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("access_token", token.getToken())
                        .param("image_url", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe")
                        .param("caption", "Automated Test Caption #testing"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode createNode = objectMapper.readTree(createResp);
        assertTrue(createNode.has("id"));
        String containerId = createNode.get("id").asText();
        assertNotNull(containerId);

        // 2. Poll Status
        String statusResp = mockMvc.perform(get("/v23.0/" + containerId)
                        .param("access_token", token.getToken())
                        .param("fields", "status_code,status"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode statusNode = objectMapper.readTree(statusResp);
        assertEquals(containerId, statusNode.get("id").asText());
        assertEquals("FINISHED", statusNode.get("status_code").asText());

        // 3. Publish Container
        String publishResp = mockMvc.perform(post("/v23.0/" + account.getIgUserId() + "/media_publish")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("access_token", token.getToken())
                        .param("creation_id", containerId))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode pubNode = objectMapper.readTree(publishResp);
        assertTrue(pubNode.has("id"));
        String publishedMediaId = pubNode.get("id").asText();
        assertNotNull(publishedMediaId);
    }

    @Test
    @DisplayName("5. Token Expiration and HTTP 401 Rejection")
    void testTokenExpirationLifecycle() throws Exception {
        FakeAccount account = fakeAccountRepository.findAll().stream().findFirst().orElseThrow();
        FakeToken token = fakeTokenRepository.findByIgUserId(account.getIgUserId()).stream().findFirst().orElseThrow();

        // Expire token via admin API
        mockMvc.perform(post("/admin/tokens/" + token.getToken() + "/expire"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EXPIRED"));

        // Live call should now return 401 Unauthorized with OAuthException 190
        mockMvc.perform(get("/v23.0/" + account.getIgUserId())
                        .param("access_token", token.getToken()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value(190))
                .andExpect(jsonPath("$.error.type").value("OAuthException"));

        // Restore token
        mockMvc.perform(post("/admin/tokens/" + token.getToken() + "/restore"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VALID"));

        // Call should succeed again
        mockMvc.perform(get("/v23.0/" + account.getIgUserId())
                        .param("access_token", token.getToken()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("6. Long-Lived Token Exchange via /v23.0/oauth/access_token")
    void testLongLivedTokenExchange() throws Exception {
        FakeAccount account = fakeAccountRepository.findAll().stream().findFirst().orElseThrow();
        FakeToken token = fakeTokenRepository.findByIgUserId(account.getIgUserId()).stream().findFirst().orElseThrow();

        String response = mockMvc.perform(get("/v23.0/oauth/access_token")
                        .param("grant_type", "fb_exchange_token")
                        .param("client_id", "test_app_id")
                        .param("client_secret", "test_app_secret")
                        .param("fb_exchange_token", token.getToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode node = objectMapper.readTree(response);
        assertTrue(node.has("access_token"));
        assertEquals("bearer", node.get("token_type").asText());
        assertEquals(5184000, node.get("expires_in").asInt());
    }

    @Test
    @DisplayName("7. Rate Limit Simulation (HTTP 429)")
    void testRateLimitSimulation() throws Exception {
        FakeAccount account = fakeAccountRepository.findAll().stream().findFirst().orElseThrow();
        FakeToken token = fakeTokenRepository.findByIgUserId(account.getIgUserId()).stream().findFirst().orElseThrow();

        // Configure strict rate limit of 1 request per minute
        simulationStateService.updateConfig(SimulationConfigRequest.builder()
                .rateLimitEnabled(true)
                .maxRequestsPerMinute(1)
                .build());

        // First call should succeed
        mockMvc.perform(get("/v23.0/" + account.getIgUserId())
                        .param("access_token", token.getToken()))
                .andExpect(status().isOk());

        // Second immediate call should hit 429 Too Many Requests
        mockMvc.perform(get("/v23.0/" + account.getIgUserId())
                        .param("access_token", token.getToken()))
                .andExpect(status().is(429))
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.error.code").value(4));
    }

    @Test
    @DisplayName("8. Forced Error Simulation (HTTP 500)")
    void testForcedErrorSimulation() throws Exception {
        FakeAccount account = fakeAccountRepository.findAll().stream().findFirst().orElseThrow();
        FakeToken token = fakeTokenRepository.findByIgUserId(account.getIgUserId()).stream().findFirst().orElseThrow();

        simulationStateService.updateConfig(SimulationConfigRequest.builder()
                .forcedErrorEnabled(true)
                .forcedStatusCode(500)
                .forcedErrorCode(2)
                .forcedErrorMessage("Simulated transient Meta outage")
                .build());

        mockMvc.perform(get("/v23.0/" + account.getIgUserId())
                        .param("access_token", token.getToken()))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error.code").value(2))
                .andExpect(jsonPath("$.error.message").value("Simulated transient Meta outage"));
    }

    @Test
    @DisplayName("9. Media Pagination with Meta Cursors")
    void testMediaPagination() throws Exception {
        FakeAccount account = fakeAccountRepository.findAll().stream().findFirst().orElseThrow();
        FakeToken token = fakeTokenRepository.findByIgUserId(account.getIgUserId()).stream().findFirst().orElseThrow();

        // Generate 15 posts for this account
        testDataGeneratorService.generatePosts(PostGenerateRequest.builder()
                .igUserId(account.getIgUserId())
                .count(15)
                .build());

        String response = mockMvc.perform(get("/v23.0/" + account.getIgUserId() + "/media")
                        .param("access_token", token.getToken())
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode node = objectMapper.readTree(response);
        assertTrue(node.has("data"));
        assertEquals(5, node.get("data").size());
        assertTrue(node.has("paging"));
        assertTrue(node.get("paging").has("cursors"));
        assertTrue(node.get("paging").get("cursors").has("after"));
    }
}
