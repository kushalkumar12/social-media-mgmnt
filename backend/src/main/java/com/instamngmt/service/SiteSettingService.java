package com.instamngmt.service;

import com.instamngmt.dto.SiteSettingDTO;
import com.instamngmt.entity.SiteSetting;
import com.instamngmt.exception.APIException;
import com.instamngmt.repository.SiteSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SiteSettingService {

    public static final String KEY_REGISTRATION_OTP_ENABLED = "REGISTRATION_OTP_ENABLED";

    private final SiteSettingRepository siteSettingRepository;

    public boolean isRegistrationOtpEnabled() {
        return siteSettingRepository.findByKey(KEY_REGISTRATION_OTP_ENABLED)
                .map(setting -> "true".equalsIgnoreCase(setting.getValue()))
                .orElse(true); // default to true if setting not found
    }

    public SiteSettingDTO.PublicSettingsResponse getPublicSettings() {
        return SiteSettingDTO.PublicSettingsResponse.builder()
                .registrationOtpEnabled(isRegistrationOtpEnabled())
                .build();
    }

    public List<SiteSettingDTO.SettingResponse> getAllSettings() {
        return siteSettingRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public SiteSettingDTO.SettingResponse updateSetting(String key, String value) {
        SiteSetting setting = siteSettingRepository.findByKey(key)
                .orElseGet(() -> SiteSetting.builder()
                        .key(key)
                        .description("Custom Site Setting")
                        .build());

        setting.setValue(value);
        SiteSetting saved = siteSettingRepository.save(setting);
        return mapToDTO(saved);
    }

    @Transactional
    public SiteSettingDTO.SettingResponse setRegistrationOtpEnabled(boolean enabled) {
        return updateSetting(KEY_REGISTRATION_OTP_ENABLED, String.valueOf(enabled));
    }

    private SiteSettingDTO.SettingResponse mapToDTO(SiteSetting setting) {
        return SiteSettingDTO.SettingResponse.builder()
                .key(setting.getKey())
                .value(setting.getValue())
                .description(setting.getDescription())
                .updatedAt(setting.getUpdatedAt())
                .build();
    }
}
