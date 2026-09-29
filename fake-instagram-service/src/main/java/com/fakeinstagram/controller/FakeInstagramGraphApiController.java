package com.fakeinstagram.controller;

import com.fakeinstagram.dto.MetaErrorResponse;
import com.fakeinstagram.entity.FakeAccount;
import com.fakeinstagram.entity.FakeComment;
import com.fakeinstagram.entity.FakeMediaContainer;
import com.fakeinstagram.entity.FakePublishedMedia;
import com.fakeinstagram.service.FakeAccountService;
import com.fakeinstagram.service.FakeMediaService;
import com.fakeinstagram.service.FakeTokenService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/{version:v\\d+\\.\\d+}")
public class FakeInstagramGraphApiController {

    private static final Logger log = LoggerFactory.getLogger(FakeInstagramGraphApiController.class);

    private final FakeAccountService fakeAccountService;
    private final FakeMediaService fakeMediaService;
    private final FakeTokenService fakeTokenService;

    public FakeInstagramGraphApiController(
            FakeAccountService fakeAccountService,
            FakeMediaService fakeMediaService,
            FakeTokenService fakeTokenService) {
        this.fakeAccountService = fakeAccountService;
        this.fakeMediaService = fakeMediaService;
        this.fakeTokenService = fakeTokenService;
    }

    /**
     * Helper to authenticate token and return error response if invalid.
     */
    private ResponseEntity<?> checkToken(String token) {
        FakeTokenService.TokenValidationResult val = fakeTokenService.validate(token);
        if (!val.isValid()) {
            if (val.isExpired()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(MetaErrorResponse.tokenExpired());
            }
            if (val.isRevoked()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(MetaErrorResponse.tokenRevoked());
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    MetaErrorResponse.generic(190, val.errorMessage() != null ? val.errorMessage() : "Invalid OAuth access token.", "OAuthException")
            );
        }
        return null;
    }

    /**
     * GET /{version}/me
     * Resolves authenticated profile based on access token.
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMe(
            @PathVariable String version,
            @RequestParam(required = false) String fields,
            @RequestParam(name = "access_token", required = false) String accessToken,
            @RequestHeader(name = "Authorization", required = false) String authHeader) {

        String token = resolveToken(accessToken, authHeader);
        ResponseEntity<?> err = checkToken(token);
        if (err != null) return err;

        Optional<FakeAccount> accountOpt = fakeAccountService.resolveAccount("me", token);
        if (accountOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(MetaErrorResponse.notFound("User not found for token."));
        }

        return ResponseEntity.ok(formatAccountResponse(accountOpt.get(), fields));
    }

    /**
     * GET /{version}/{id}
     * Polymorphic Meta Graph API endpoint:
     * - If ID is a media container: returns container processing status
     * - If ID is a user ID or 'me': returns profile metadata
     * - If ID is a published media item: returns media details
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getObjectById(
            @PathVariable String version,
            @PathVariable String id,
            @RequestParam(required = false) String fields,
            @RequestParam(name = "access_token", required = false) String accessToken,
            @RequestHeader(name = "Authorization", required = false) String authHeader) {

        String token = resolveToken(accessToken, authHeader);
        ResponseEntity<?> err = checkToken(token);
        if (err != null) return err;

        String cleanId = id.trim();

        // 1. Check if it's a Media Container ID (e.g. status polling)
        Optional<FakeMediaContainer> containerOpt = fakeMediaService.getContainer(cleanId);
        if (containerOpt.isPresent()) {
            FakeMediaContainer container = containerOpt.get();
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("id", container.getContainerId());
            resp.put("status_code", container.getStatusCode());
            resp.put("status", container.getStatusMessage() != null ? container.getStatusMessage() : "Ready");
            return ResponseEntity.ok(resp);
        }

        // 2. Check if it's a User Account (ID or 'me')
        Optional<FakeAccount> accountOpt = fakeAccountService.resolveAccount(cleanId, token);
        if (accountOpt.isPresent()) {
            return ResponseEntity.ok(formatAccountResponse(accountOpt.get(), fields));
        }

        // 3. Check if it's a Published Media Object
        Optional<FakePublishedMedia> mediaOpt = fakeMediaService.getMediaById(cleanId);
        if (mediaOpt.isPresent()) {
            return ResponseEntity.ok(formatMediaResponse(mediaOpt.get(), fields));
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(MetaErrorResponse.notFound("Object with ID " + cleanId + " does not exist."));
    }

    /**
     * POST /{version}/{id}/media and POST /{version}/me/media
     * Creates an asynchronous media container.
     */
    @PostMapping(value = {"/{id}/media", "/me/media"}, consumes = "application/x-www-form-urlencoded")
    public ResponseEntity<?> createMediaContainer(
            @PathVariable String version,
            @PathVariable(required = false) String id,
            @RequestParam(name = "access_token", required = false) String accessToken,
            @RequestParam(name = "image_url", required = false) String imageUrl,
            @RequestParam(name = "video_url", required = false) String videoUrl,
            @RequestParam(name = "media_type", required = false) String mediaType,
            @RequestParam(name = "caption", required = false) String caption,
            @RequestParam(name = "is_carousel_item", defaultValue = "false") boolean isCarouselItem,
            @RequestParam(name = "children", required = false) String children,
            @RequestHeader(name = "Authorization", required = false) String authHeader) {

        String token = resolveToken(accessToken, authHeader);
        ResponseEntity<?> err = checkToken(token);
        if (err != null) return err;

        String effectiveUserId = (id != null && !"me".equalsIgnoreCase(id)) ? id : "17841400000000001";
        String mediaUrl = (videoUrl != null && !videoUrl.isBlank()) ? videoUrl : imageUrl;
        String resolvedType = mediaType != null ? mediaType.toUpperCase() : "IMAGE";

        String containerId = fakeMediaService.createContainer(effectiveUserId, resolvedType, mediaUrl, caption, isCarouselItem, children);
        log.info("Fake Meta Container created: {} for user: {}", containerId, effectiveUserId);

        Map<String, String> response = new HashMap<>();
        response.put("id", containerId);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /{version}/{id}/media_publish and POST /{version}/me/media_publish
     * Publishes a finished container to the live account feed.
     */
    @PostMapping(value = {"/{id}/media_publish", "/me/media_publish"}, consumes = "application/x-www-form-urlencoded")
    public ResponseEntity<?> publishMedia(
            @PathVariable String version,
            @PathVariable(required = false) String id,
            @RequestParam(name = "creation_id") String creationId,
            @RequestParam(name = "access_token", required = false) String accessToken,
            @RequestHeader(name = "Authorization", required = false) String authHeader) {

        String token = resolveToken(accessToken, authHeader);
        ResponseEntity<?> err = checkToken(token);
        if (err != null) return err;

        String effectiveUserId = (id != null && !"me".equalsIgnoreCase(id)) ? id : "17841400000000001";
        String mediaId = fakeMediaService.publishMedia(effectiveUserId, creationId);
        log.info("Fake Meta Media published: {} for container: {}", mediaId, creationId);

        Map<String, String> response = new HashMap<>();
        response.put("id", mediaId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /{version}/oauth/access_token
     * Long-lived token exchange endpoint.
     */
    @GetMapping("/oauth/access_token")
    public ResponseEntity<?> exchangeToken(
            @PathVariable String version,
            @RequestParam(name = "grant_type", defaultValue = "fb_exchange_token") String grantType,
            @RequestParam(name = "client_id", required = false) String clientId,
            @RequestParam(name = "client_secret", required = false) String clientSecret,
            @RequestParam(name = "fb_exchange_token") String exchangeToken) {

        String refreshedToken = fakeTokenService.refreshLongLivedToken(exchangeToken);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("access_token", refreshedToken);
        resp.put("token_type", "bearer");
        resp.put("expires_in", 5184000); // 60 days in seconds
        return ResponseEntity.ok(resp);
    }

    /**
     * GET /{version}/{id}/media
     * Returns paginated list of published posts with Meta cursor structure.
     */
    @GetMapping("/{id}/media")
    public ResponseEntity<?> getUserMedia(
            @PathVariable String version,
            @PathVariable String id,
            @RequestParam(defaultValue = "25") int limit,
            @RequestParam(required = false) String after,
            @RequestParam(required = false) String before,
            @RequestParam(required = false) String fields,
            @RequestParam(name = "access_token", required = false) String accessToken,
            @RequestHeader(name = "Authorization", required = false) String authHeader,
            HttpServletRequest request) {

        String token = resolveToken(accessToken, authHeader);
        ResponseEntity<?> err = checkToken(token);
        if (err != null) return err;

        int pageNum = 0;
        if (after != null && after.startsWith("cursor_")) {
            try {
                pageNum = Integer.parseInt(after.replace("cursor_", ""));
            } catch (Exception ignored) {}
        }

        Page<FakePublishedMedia> page = fakeMediaService.getUserMedia(id, PageRequest.of(pageNum, Math.min(limit, 100)));
        List<Map<String, Object>> dataList = new ArrayList<>();
        for (FakePublishedMedia media : page.getContent()) {
            dataList.add(formatMediaResponse(media, fields));
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("data", dataList);

        Map<String, Object> paging = new LinkedHashMap<>();
        Map<String, String> cursors = new LinkedHashMap<>();
        cursors.put("before", "cursor_" + Math.max(0, pageNum - 1));
        cursors.put("after", "cursor_" + (pageNum + 1));
        paging.put("cursors", cursors);

        String baseUrl = request.getRequestURL().toString();
        if (page.hasNext()) {
            paging.put("next", String.format("%s?limit=%d&after=cursor_%d&access_token=%s", baseUrl, limit, pageNum + 1, token));
        }
        if (pageNum > 0) {
            paging.put("previous", String.format("%s?limit=%d&before=cursor_%d&access_token=%s", baseUrl, limit, pageNum - 1, token));
        }
        resp.put("paging", paging);

        return ResponseEntity.ok(resp);
    }

    /**
     * GET /{version}/{id}/comments
     * Returns comments for a post.
     */
    @GetMapping("/{id}/comments")
    public ResponseEntity<?> getComments(
            @PathVariable String version,
            @PathVariable String id,
            @RequestParam(defaultValue = "25") int limit,
            @RequestParam(name = "access_token", required = false) String accessToken,
            @RequestHeader(name = "Authorization", required = false) String authHeader) {

        String token = resolveToken(accessToken, authHeader);
        ResponseEntity<?> err = checkToken(token);
        if (err != null) return err;

        Page<FakeComment> commentsPage = fakeMediaService.getComments(id, PageRequest.of(0, Math.min(limit, 100)));
        List<Map<String, Object>> data = new ArrayList<>();
        for (FakeComment c : commentsPage.getContent()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", c.getCommentId());
            item.put("text", c.getText());
            item.put("username", c.getUsername());
            item.put("timestamp", c.getTimestamp().toString());
            data.add(item);
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("data", data);
        return ResponseEntity.ok(resp);
    }

    /**
     * GET /{version}/{id}/insights
     * Returns simulated account insights metrics.
     */
    @GetMapping("/{id}/insights")
    public ResponseEntity<?> getInsights(
            @PathVariable String version,
            @PathVariable String id,
            @RequestParam(defaultValue = "impressions,reach,profile_views") String metric,
            @RequestParam(defaultValue = "day") String period,
            @RequestParam(name = "access_token", required = false) String accessToken,
            @RequestHeader(name = "Authorization", required = false) String authHeader) {

        String token = resolveToken(accessToken, authHeader);
        ResponseEntity<?> err = checkToken(token);
        if (err != null) return err;

        List<Map<String, Object>> data = new ArrayList<>();
        for (String m : metric.split(",")) {
            Map<String, Object> metricObj = new LinkedHashMap<>();
            metricObj.put("name", m.trim());
            metricObj.put("period", period);
            metricObj.put("title", m.trim().replace("_", " ").toUpperCase());
            metricObj.put("description", "Daily simulated metric for " + m.trim());

            List<Map<String, Object>> values = new ArrayList<>();
            Map<String, Object> valObj = new LinkedHashMap<>();
            valObj.put("value", (int) (Math.random() * 5000 + 500));
            valObj.put("end_time", java.time.LocalDate.now().toString());
            values.add(valObj);

            metricObj.put("values", values);
            data.add(metricObj);
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("data", data);
        return ResponseEntity.ok(resp);
    }

    private String resolveToken(String queryToken, String authHeader) {
        if (queryToken != null && !queryToken.isBlank()) {
            return queryToken.trim();
        }
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }
        return queryToken;
    }

    private Map<String, Object> formatAccountResponse(FakeAccount account, String fields) {
        Set<String> requested = (fields != null && !fields.isBlank())
                ? new HashSet<>(Arrays.asList(fields.split(",")))
                : Set.of("id", "username", "name", "profile_picture_url", "followers_count", "follows_count", "media_count", "biography", "account_type");

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", account.getIgUserId());

        if (requested.contains("username") || requested.isEmpty()) map.put("username", account.getUsername());
        if (requested.contains("name")) map.put("name", account.getName());
        if (requested.contains("profile_picture_url")) map.put("profile_picture_url", account.getProfilePictureUrl());
        if (requested.contains("followers_count")) map.put("followers_count", account.getFollowersCount());
        if (requested.contains("follows_count")) map.put("follows_count", account.getFollowingCount());
        if (requested.contains("media_count")) map.put("media_count", account.getMediaCount());
        if (requested.contains("biography")) map.put("biography", account.getBiography());
        if (requested.contains("account_type")) map.put("account_type", account.getAccountType());

        return map;
    }

    private Map<String, Object> formatMediaResponse(FakePublishedMedia media, String fields) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", media.getMediaId());
        map.put("media_type", media.getPostType());
        map.put("media_url", media.getMediaUrl());
        map.put("caption", media.getCaption());
        map.put("permalink", media.getPermalink());
        map.put("like_count", media.getLikeCount());
        map.put("comments_count", media.getCommentsCount());
        map.put("timestamp", media.getPublishedAt().toString());
        return map;
    }
}
