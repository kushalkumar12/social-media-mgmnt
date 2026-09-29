package com.instamngmt.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.instamngmt.entity.PostType;
import com.instamngmt.exception.APIException;
import com.instamngmt.util.AppSecretProofUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class InstagramClientService {

    private static final Logger log = LoggerFactory.getLogger(InstagramClientService.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    
    @Value("${instagram.provider:real}")
    private String provider;

    @Value("${instagram.graph-api-base-url:https://graph.facebook.com}")
    private String graphApiBaseUrl;

    @Value("${instagram.simulator-base-url:http://localhost:8085}")
    private String simulatorBaseUrl;

    @Value("${instagram.api-version:v23.0}")
    private String apiVersion;

    @Value("${instagram.app-id:dummy-app-id}")
    private String appId;

    @Value("${instagram.app-secret:dummy-app-secret}")
    private String appSecret;

    public InstagramClientService(WebClient instagramWebClient, ObjectMapper objectMapper) {
        this.webClient = instagramWebClient;
        this.objectMapper = objectMapper;
    }

    private String resolveBaseHost(String accessToken) {
        if ("fake".equalsIgnoreCase(provider)) {
            return simulatorBaseUrl;
        }
        if (accessToken != null && accessToken.trim().startsWith("IG")) {
            return "https://graph.instagram.com";
        }
        return graphApiBaseUrl != null && !graphApiBaseUrl.isBlank() ? graphApiBaseUrl : "https://graph.facebook.com";
    }

    private String getAlternateHost(String host) {
        if ("fake".equalsIgnoreCase(provider)) {
            return simulatorBaseUrl;
        }
        if ("https://graph.instagram.com".equalsIgnoreCase(host)) {
            return graphApiBaseUrl != null && !graphApiBaseUrl.isBlank() ? graphApiBaseUrl : "https://graph.facebook.com";
        }
        return "https://graph.instagram.com";
    }

    public AccountInfo getAccountInfo(String accessToken) {
        String cleanToken = accessToken != null ? accessToken.trim() : "";
        String primaryHost = resolveBaseHost(cleanToken);
        String alternateHost = getAlternateHost(primaryHost);

        try {
            return executeGetAccountInfo(primaryHost, cleanToken);
        } catch (Exception e) {
            log.warn("Account info request failed on primary host {}. Retrying on alternate host {}...", primaryHost, alternateHost);
            try {
                return executeGetAccountInfo(alternateHost, cleanToken);
            } catch (Exception ex2) {
                log.error("Failed to fetch Instagram account info on both hosts", ex2);
                throw new APIException(HttpStatus.BAD_GATEWAY, "META_API_ERROR", "Failed to connect to Meta Graph API: " + extractMetaErrorMessage(ex2));
            }
        }
    }

    private AccountInfo executeGetAccountInfo(String host, String token) {
        String uri = String.format("%s/%s/me?fields=id,username,account_type&access_token=%s", host, apiVersion, token);
        if (host.contains("facebook.com") && hasValidAppSecret()) {
            uri += "&appsecret_proof=" + AppSecretProofUtil.generateAppSecretProof(token, appSecret);
        }
        String response = WebClient.create().get()
                .uri(uri)
                .retrieve()
                .bodyToMono(String.class)
                .block();
        try {
            JsonNode node = objectMapper.readTree(response);
            return new AccountInfo(
                    node.get("id").asText(),
                    node.get("username").asText(),
                    node.has("account_type") ? node.get("account_type").asText() : "BUSINESS",
                    ""
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse account info: " + e.getMessage(), e);
        }
    }

    public String createMediaContainer(String igUserId, String accessToken, PostType postType, String mediaCdnUrl, String caption, List<String> childContainerIds) {
        return createMediaContainer(igUserId, accessToken, postType, mediaCdnUrl, caption, childContainerIds, false);
    }

    public String createMediaContainer(String igUserId, String accessToken, PostType postType, String mediaCdnUrl, String caption, List<String> childContainerIds, boolean isCarouselItem) {
        log.info("Creating real Meta media container for igUserId: {}, type: {}, isCarouselItem: {}", igUserId, postType, isCarouselItem);

        if (mediaCdnUrl != null && (mediaCdnUrl.contains("localhost") || mediaCdnUrl.contains("127.0.0.1"))) {
            if (!"fake".equalsIgnoreCase(provider)) {
                throw new APIException(HttpStatus.BAD_REQUEST, "LOCAL_MEDIA_URL_UNSUPPORTED",
                        "Meta Graph API cannot fetch media from localhost (" + mediaCdnUrl + "). Media must be hosted on a public internet URL (e.g. ImgBB, S3, Cloudinary).");
            }
        }

        String cleanToken = accessToken != null ? accessToken.trim() : "";
        String cleanUserId = igUserId != null ? igUserId.trim() : "";
        String primaryHost = resolveBaseHost(cleanToken);
        String alternateHost = getAlternateHost(primaryHost);

        try {
            return executeCreateMediaContainer(primaryHost, cleanUserId, cleanToken, postType, mediaCdnUrl, caption, childContainerIds, isCarouselItem);
        } catch (Exception e) {
            String primaryErr = extractMetaErrorMessage(e);
            log.warn("Media container creation failed on primary host {} (error: {}). Retrying on alternate host {}...", primaryHost, primaryErr, alternateHost);
            try {
                return executeCreateMediaContainer(alternateHost, cleanUserId, cleanToken, postType, mediaCdnUrl, caption, childContainerIds, isCarouselItem);
            } catch (Exception ex2) {
                log.error("Failed to create Instagram media container on both hosts for igUserId: {}", cleanUserId, ex2);
                String detailedErrorMsg = extractMetaErrorMessage(ex2);
                throw new APIException(HttpStatus.BAD_GATEWAY, "CONTAINER_CREATION_FAILED", "Meta container creation failed: " + detailedErrorMsg);
            }
        }
    }

    private String executeCreateMediaContainer(String host, String igUserId, String accessToken, PostType postType, String mediaCdnUrl, String caption, List<String> childContainerIds, boolean isCarouselItem) {
        List<String> targetEndpoints = new java.util.ArrayList<>();
        if (igUserId != null && !igUserId.isBlank()) {
            targetEndpoints.add(String.format("%s/%s/%s/media", host, apiVersion, igUserId));
        }
        if (host.contains("instagram.com")) {
            targetEndpoints.add(String.format("%s/%s/me/media", host, apiVersion));
        }

        org.springframework.util.MultiValueMap<String, String> formData = new org.springframework.util.LinkedMultiValueMap<>();
        formData.add("access_token", accessToken);
        if (host.contains("facebook.com") && hasValidAppSecret()) {
            formData.add("appsecret_proof", AppSecretProofUtil.generateAppSecretProof(accessToken, appSecret));
        }

        if (isCarouselItem) {
            formData.add("is_carousel_item", "true");
        }

        if (postType == PostType.REELS) {
            formData.add("media_type", "REELS");
            formData.add("video_url", mediaCdnUrl);
            if (caption != null && !caption.isBlank()) {
                formData.add("caption", caption);
            }
        } else if (postType == PostType.CAROUSEL) {
            formData.add("media_type", "CAROUSEL");
            if (childContainerIds != null) {
                try {
                    formData.add("children", objectMapper.writeValueAsString(childContainerIds));
                } catch (Exception ignored) {
                    formData.add("children", String.join(",", childContainerIds));
                }
            }
            if (caption != null && !caption.isBlank()) {
                formData.add("caption", caption);
            }
        } else if (postType == PostType.SINGLE_VIDEO) {
            formData.add("media_type", "VIDEO");
            formData.add("video_url", mediaCdnUrl);
            if (caption != null && !caption.isBlank()) {
                formData.add("caption", caption);
            }
        } else {
            formData.add("image_url", mediaCdnUrl);
            if (!isCarouselItem && caption != null && !caption.isBlank()) {
                formData.add("caption", caption);
            }
        }

        Exception lastException = null;
        for (String url : targetEndpoints) {
            try {
                log.info("Attempting Meta container creation at: {}", url);
                String response = WebClient.create().post()
                        .uri(url)
                        .body(org.springframework.web.reactive.function.BodyInserters.fromFormData(formData))
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                JsonNode node = objectMapper.readTree(response);
                if (node.has("id")) {
                    String containerId = node.get("id").asText();
                    log.info("Real Meta container created: {}", containerId);
                    return containerId;
                }
            } catch (Exception e) {
                lastException = e;
                log.warn("Container creation attempt at {} failed: {}", url, extractMetaErrorMessage(e));
            }
        }

        throw lastException != null ? (RuntimeException) (lastException instanceof RuntimeException ? lastException : new RuntimeException(lastException)) : new RuntimeException("Container creation failed");
    }

    public ContainerStatus checkContainerStatus(String containerId, String accessToken) {
        String cleanToken = accessToken != null ? accessToken.trim() : "";
        String primaryHost = resolveBaseHost(cleanToken);
        String alternateHost = getAlternateHost(primaryHost);

        try {
            return executeCheckContainerStatus(primaryHost, containerId, cleanToken);
        } catch (Exception e) {
            log.warn("Check container status failed on primary host {}. Retrying on alternate host {}...", primaryHost, alternateHost);
            try {
                return executeCheckContainerStatus(alternateHost, containerId, cleanToken);
            } catch (Exception ex2) {
                log.error("Failed to check container status on both hosts", ex2);
                return new ContainerStatus("ERROR", extractMetaErrorMessage(ex2));
            }
        }
    }

    private ContainerStatus executeCheckContainerStatus(String host, String containerId, String accessToken) {
        String uri = String.format("%s/%s/%s?fields=status_code,status&access_token=%s",
                host, apiVersion, containerId, accessToken);
        if (host.contains("facebook.com") && hasValidAppSecret()) {
            uri += "&appsecret_proof=" + AppSecretProofUtil.generateAppSecretProof(accessToken, appSecret);
        }

        String response = WebClient.create().get()
                .uri(uri)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            JsonNode node = objectMapper.readTree(response);
            String statusCode = node.has("status_code") ? node.get("status_code").asText() : "FINISHED";
            String statusMessage = node.has("status") ? node.get("status").asText() : "";
            return new ContainerStatus(statusCode, statusMessage);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse container status: " + e.getMessage(), e);
        }
    }

    public String publishMedia(String igUserId, String containerId, String accessToken) {
        String cleanToken = accessToken != null ? accessToken.trim() : "";
        String cleanUserId = igUserId != null ? igUserId.trim() : "";
        String primaryHost = resolveBaseHost(cleanToken);
        String alternateHost = getAlternateHost(primaryHost);

        try {
            return executePublishMedia(primaryHost, cleanUserId, containerId, cleanToken);
        } catch (Exception e) {
            String primaryErr = extractMetaErrorMessage(e);
            log.warn("Publish media failed on primary host {} (error: {}). Retrying on alternate host {}...", primaryHost, primaryErr, alternateHost);
            try {
                return executePublishMedia(alternateHost, cleanUserId, containerId, cleanToken);
            } catch (Exception ex2) {
                log.error("Failed to publish Instagram media container on both hosts", ex2);
                String detailedErrorMsg = extractMetaErrorMessage(ex2);
                throw new APIException(HttpStatus.BAD_GATEWAY, "PUBLISH_FAILED", "Meta media_publish failed: " + detailedErrorMsg);
            }
        }
    }

    private String executePublishMedia(String host, String igUserId, String containerId, String accessToken) {
        List<String> targetEndpoints = new java.util.ArrayList<>();
        if (igUserId != null && !igUserId.isBlank()) {
            targetEndpoints.add(String.format("%s/%s/%s/media_publish", host, apiVersion, igUserId));
        }
        if (host.contains("instagram.com")) {
            targetEndpoints.add(String.format("%s/%s/me/media_publish", host, apiVersion));
        }

        org.springframework.util.MultiValueMap<String, String> formData = new org.springframework.util.LinkedMultiValueMap<>();
        formData.add("creation_id", containerId);
        formData.add("access_token", accessToken);
        if (host.contains("facebook.com") && hasValidAppSecret()) {
            formData.add("appsecret_proof", AppSecretProofUtil.generateAppSecretProof(accessToken, appSecret));
        }

        Exception lastException = null;
        for (String url : targetEndpoints) {
            try {
                log.info("Attempting Meta media_publish at: {}", url);
                String response = WebClient.create().post()
                        .uri(url)
                        .body(org.springframework.web.reactive.function.BodyInserters.fromFormData(formData))
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                JsonNode node = objectMapper.readTree(response);
                if (node.has("id")) {
                    String publishedMediaId = node.get("id").asText();
                    log.info("Published Instagram media ID: {}", publishedMediaId);
                    return publishedMediaId;
                }
            } catch (Exception e) {
                lastException = e;
                log.warn("Media publish attempt at {} failed: {}", url, extractMetaErrorMessage(e));
            }
        }

        throw lastException != null ? (RuntimeException) (lastException instanceof RuntimeException ? lastException : new RuntimeException(lastException)) : new RuntimeException("Publish failed");
    }

    public String refreshLongLivedToken(String currentToken) {
        if (!"fake".equalsIgnoreCase(provider) && (!hasValidAppSecret() || appId == null || appId.isBlank() || appId.contains("dummy"))) {
            log.info("App ID or App Secret not configured for Meta long-lived token exchange; retaining current token.");
            return currentToken;
        }

        try {
            String uri = String.format("/%s/oauth/access_token?grant_type=fb_exchange_token&client_id=%s&client_secret=%s&fb_exchange_token=%s",
                    apiVersion, appId, appSecret, currentToken);

            String response = webClient.get()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode node = objectMapper.readTree(response);
            return node.has("access_token") ? node.get("access_token").asText() : currentToken;
        } catch (Exception e) {
            log.warn("Meta long-lived token exchange notice: {}", e.getMessage());
            return currentToken;
        }
    }

    public record DetailedAccountInfo(
            String igUserId,
            String username,
            String profilePictureUrl,
            int followersCount,
            int followingCount,
            int mediaCount,
            String biography,
            boolean valid
    ) {}

    public DetailedAccountInfo fetchAccountDetails(String userId, String accessToken) {
        String cleanUserId = userId != null ? userId.trim() : "";
        String cleanToken = accessToken != null ? accessToken.trim() : "";

        if (cleanToken.isBlank()) {
            throw new APIException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN", "Access token is required");
        }

        String primaryHost = resolveBaseHost(cleanToken);
        String alternateHost = getAlternateHost(primaryHost);

        try {
            return executeFetchAccountDetails(primaryHost, cleanUserId, cleanToken);
        } catch (Exception e) {
            log.warn("Fetch account details failed on primary host {}. Retrying on alternate host {}...", primaryHost, alternateHost);
            try {
                return executeFetchAccountDetails(alternateHost, cleanUserId, cleanToken);
            } catch (Exception ex2) {
                log.error("Failed Meta Graph API verification on both hosts for userId: {}", cleanUserId, ex2);
                String detailedErrorMsg = extractMetaErrorMessage(ex2);
                throw new APIException(HttpStatus.BAD_REQUEST, "META_API_ERROR", 
                        "Meta Graph API Error: " + detailedErrorMsg);
            }
        }
    }

    private DetailedAccountInfo executeFetchAccountDetails(String host, String userId, String token) {
        String targetEndpoint = (userId != null && userId.matches("\\d+")) ? userId : "me";
        String fields = host.contains("instagram.com") 
                ? "id,username,account_type,profile_picture_url,followers_count,follows_count,media_count,biography"
                : "id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography";
        
        String url = String.format("%s/%s/%s?fields=%s&access_token=%s",
                host, apiVersion, targetEndpoint, fields, token);
        if (host.contains("facebook.com") && hasValidAppSecret()) {
            url += "&appsecret_proof=" + AppSecretProofUtil.generateAppSecretProof(token, appSecret);
        }

        log.info("Fetching Meta Graph API live account details from: {} for target: {}", host, targetEndpoint);

        String response = WebClient.create().get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            JsonNode node = objectMapper.readTree(response);
            String fetchedId = node.has("id") ? node.get("id").asText() : userId;
            String fetchedUsername = node.has("username") ? node.get("username").asText() 
                    : (node.has("name") ? node.get("name").asText() : userId);
            String profilePic = node.has("profile_picture_url") ? node.get("profile_picture_url").asText() : null;
            int followers = node.has("followers_count") ? node.get("followers_count").asInt() : 0;
            int following = node.has("follows_count") ? node.get("follows_count").asInt() : 0;
            int mediaCount = node.has("media_count") ? node.get("media_count").asInt() : 0;
            String bio = node.has("biography") ? node.get("biography").asText() : "";

            return new DetailedAccountInfo(fetchedId, fetchedUsername, profilePic, followers, following, mediaCount, bio, true);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse account details: " + e.getMessage(), e);
        }
    }

    private String extractMetaErrorMessage(Exception e) {
        if (e instanceof org.springframework.web.reactive.function.client.WebClientResponseException wre) {
            try {
                JsonNode errNode = objectMapper.readTree(wre.getResponseBodyAsString());
                if (errNode.has("error") && errNode.get("error").has("message")) {
                    return errNode.get("error").get("message").asText();
                }
            } catch (Exception ignored) {}
        }
        return e.getMessage();
    }

    private boolean hasValidAppSecret() {
        return appSecret != null && !appSecret.isBlank() && !"dummy-app-secret".equalsIgnoreCase(appSecret.trim());
    }

    public record AccountInfo(String igUserId, String username, String accountType, String facebookPageId) {}
    public record ContainerStatus(String statusCode, String statusMessage) {}
}
