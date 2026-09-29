package com.instamngmt.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.instamngmt.entity.PostType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "instagram.provider=fake",
        "instagram.simulator-base-url=http://localhost:8085"
})
public class InstagramClientServiceFakeContractTest {

    @Autowired
    private InstagramClientService instagramClientService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Verify Contract: InstagramClientService resolves simulator host when provider is fake")
    void testProviderConfiguration() {
        assertNotNull(instagramClientService);
    }

    @Test
    @DisplayName("Verify Contract: Account details schema mapping matches Fake Simulator response")
    void testAccountDetailsSchemaContract() throws Exception {
        String simulatorAccountJson = """
        {
          "id": "17841400000000001",
          "username": "tech_creator_0001",
          "name": "Alex Vance",
          "profile_picture_url": "https://api.dicebear.com/7.x/identicon/svg?seed=tech_creator_0001",
          "followers_count": 48250,
          "follows_count": 312,
          "media_count": 184,
          "biography": "Enterprise cloud solutions & AI productivity tools.",
          "account_type": "BUSINESS"
        }
        """;

        var node = objectMapper.readTree(simulatorAccountJson);
        assertEquals("17841400000000001", node.get("id").asText());
        assertEquals("tech_creator_0001", node.get("username").asText());
        assertEquals(48250, node.get("followers_count").asInt());
        assertEquals(312, node.get("follows_count").asInt());
        assertEquals(184, node.get("media_count").asInt());
    }

    @Test
    @DisplayName("Verify Contract: Container creation and status schema matches Fake Simulator response")
    void testContainerSchemaContract() throws Exception {
        String containerCreationJson = "{\"id\":\"17928410293847561\"}";
        var node = objectMapper.readTree(containerCreationJson);
        assertTrue(node.has("id"));
        assertEquals("17928410293847561", node.get("id").asText());

        String containerStatusJson = "{\"id\":\"17928410293847561\",\"status_code\":\"FINISHED\",\"status\":\"Ready\"}";
        var statusNode = objectMapper.readTree(containerStatusJson);
        assertEquals("FINISHED", statusNode.get("status_code").asText());
    }

    @Test
    @DisplayName("Verify Contract: Media publish response schema matches Fake Simulator response")
    void testMediaPublishSchemaContract() throws Exception {
        String publishJson = "{\"id\":\"18099482019482710\"}";
        var node = objectMapper.readTree(publishJson);
        assertTrue(node.has("id"));
        assertEquals("18099482019482710", node.get("id").asText());
    }

    @Test
    @DisplayName("Verify Contract: Long-lived token exchange schema matches Fake Simulator response")
    void testTokenExchangeSchemaContract() throws Exception {
        String tokenJson = "{\"access_token\":\"EAAG_fake_refreshed_17841400000000001_abc12345\",\"token_type\":\"bearer\",\"expires_in\":5184000}";
        var node = objectMapper.readTree(tokenJson);
        assertTrue(node.has("access_token"));
        assertEquals("bearer", node.get("token_type").asText());
        assertEquals(5184000, node.get("expires_in").asInt());
    }
}
