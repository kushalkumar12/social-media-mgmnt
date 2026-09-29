package com.instamngmt.service;

import com.instamngmt.entity.PostType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "instagram.provider=fake",
        "instagram.simulator-base-url=http://localhost:8085",
        "instagram.graph-api-base-url=http://localhost:8085"
})
public class LiveSimulatorIntegrationTest {

    @Autowired
    private InstagramClientService instagramClientService;

    private static final String TEST_USER_ID = "17841400000026541";
    private static final String TEST_TOKEN = "EAAG_fake_token_17841400000026541_5032";

    @Test
    @DisplayName("Live Integration: Fetch Account Details from Fake Simulator")
    void testLiveFetchAccountDetails() {
        InstagramClientService.DetailedAccountInfo details =
                instagramClientService.fetchAccountDetails(TEST_USER_ID, TEST_TOKEN);

        assertNotNull(details);
        assertEquals(TEST_USER_ID, details.igUserId());
        assertNotNull(details.username());
        assertTrue(details.followersCount() > 0);
        assertTrue(details.valid());
    }

    @Test
    @DisplayName("Live Integration: Get Account Info /me from Fake Simulator")
    void testLiveGetAccountInfo() {
        InstagramClientService.AccountInfo info =
                instagramClientService.getAccountInfo(TEST_TOKEN);

        assertNotNull(info);
        assertNotNull(info.igUserId());
        assertNotNull(info.username());
    }

    @Test
    @DisplayName("Live Integration: Create Container, Check Status, and Publish Media on Fake Simulator")
    void testLiveMediaPublishingLifecycle() {
        // 1. Create Media Container
        String containerId = instagramClientService.createMediaContainer(
                TEST_USER_ID,
                TEST_TOKEN,
                PostType.SINGLE_IMAGE,
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
                "Live Integration Post from InstaMngmt! #meta #simulation",
                null,
                false
        );
        assertNotNull(containerId);
        assertTrue(containerId.startsWith("179"));

        // 2. Check Container Transcoding Status
        InstagramClientService.ContainerStatus status =
                instagramClientService.checkContainerStatus(containerId, TEST_TOKEN);
        assertNotNull(status);
        assertEquals("FINISHED", status.statusCode());

        // 3. Publish Media Container
        String publishedMediaId = instagramClientService.publishMedia(TEST_USER_ID, containerId, TEST_TOKEN);
        assertNotNull(publishedMediaId);
        assertTrue(publishedMediaId.startsWith("180"));
    }

    @Test
    @DisplayName("Live Integration: Long-Lived Token Refresh against Fake Simulator")
    void testLiveTokenRefresh() {
        String refreshedToken = instagramClientService.refreshLongLivedToken(TEST_TOKEN);
        assertNotNull(refreshedToken);
        assertTrue(refreshedToken.startsWith("EAAG_fake_refreshed_"));
    }
}
