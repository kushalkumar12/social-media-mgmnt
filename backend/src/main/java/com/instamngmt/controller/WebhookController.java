package com.instamngmt.controller;

import com.instamngmt.dto.WebhookDTOs;
import com.instamngmt.service.InstagramAuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);
    private final InstagramAuthService instagramAuthService;

    public WebhookController(InstagramAuthService instagramAuthService) {
        this.instagramAuthService = instagramAuthService;
    }

    @GetMapping("/instagram")
    public ResponseEntity<String> verifyWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String verifyToken,
            @RequestParam("hub.challenge") String challenge) {
        log.info("Received Meta webhook verification request. Mode: {}", mode);
        return ResponseEntity.ok(challenge);
    }

    @PostMapping("/deauthorize")
    public ResponseEntity<Map<String, String>> handleDeauthorize(@RequestBody Map<String, Object> payload) {
        log.info("Received Meta Deauthorization webhook: {}", payload);
        if (payload.containsKey("user_id")) {
            instagramAuthService.handleDeauthorizeWebhook(payload.get("user_id").toString());
        }
        return ResponseEntity.ok(Map.of("status", "success"));
    }

    @PostMapping("/data-deletion")
    public ResponseEntity<WebhookDTOs.DataDeletionResponse> handleDataDeletion(@RequestBody Map<String, Object> payload) {
        log.info("Received Meta Data Deletion request: {}", payload);
        String confirmationCode = "DEL_" + UUID.randomUUID().toString().substring(0, 8);
        String trackingUrl = "https://your-domain.com/data-deletion-status?id=" + confirmationCode;

        WebhookDTOs.DataDeletionResponse response = WebhookDTOs.DataDeletionResponse.builder()
                .url(trackingUrl)
                .confirmationCode(confirmationCode)
                .build();

        return ResponseEntity.ok(response);
    }
}
