package com.instamngmt.controller;

import com.instamngmt.dto.SiteSettingDTO;
import com.instamngmt.service.SiteSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SiteSettingController {

    private final SiteSettingService siteSettingService;

    @GetMapping("/public")
    public ResponseEntity<SiteSettingDTO.PublicSettingsResponse> getPublicSettings() {
        return ResponseEntity.ok(siteSettingService.getPublicSettings());
    }

    @GetMapping("/admin")
    public ResponseEntity<List<SiteSettingDTO.SettingResponse>> getAllSettings() {
        return ResponseEntity.ok(siteSettingService.getAllSettings());
    }

    @PutMapping("/admin/{key}")
    public ResponseEntity<SiteSettingDTO.SettingResponse> updateSetting(
            @PathVariable String key,
            @RequestBody SiteSettingDTO.UpdateSettingRequest request) {
        return ResponseEntity.ok(siteSettingService.updateSetting(key, request.getValue()));
    }

    @PostMapping("/admin/toggle-otp")
    public ResponseEntity<SiteSettingDTO.SettingResponse> toggleOtpFlag(
            @RequestParam boolean enabled) {
        return ResponseEntity.ok(siteSettingService.setRegistrationOtpEnabled(enabled));
    }
}
