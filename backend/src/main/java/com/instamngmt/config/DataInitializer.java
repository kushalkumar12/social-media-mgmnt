package com.instamngmt.config;

import com.instamngmt.entity.SiteSetting;
import com.instamngmt.entity.User;
import com.instamngmt.entity.UserPlan;
import com.instamngmt.repository.SiteSettingRepository;
import com.instamngmt.repository.UserRepository;
import com.instamngmt.service.SiteSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.instamngmt.entity.AccountGroup;
import com.instamngmt.repository.AccountGroupRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SiteSettingRepository siteSettingRepository;
    private final AccountGroupRepository accountGroupRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Initialize Site Admin User: username - admin, password - admin
        User admin1 = createOrUpdateAdminUser("admin");
        User admin2 = createOrUpdateAdminUser("admin@instamngmt.com");

        // 2. Initialize Default Site Settings
        if (siteSettingRepository.findByKey(SiteSettingService.KEY_REGISTRATION_OTP_ENABLED).isEmpty()) {
            SiteSetting otpSetting = SiteSetting.builder()
                    .key(SiteSettingService.KEY_REGISTRATION_OTP_ENABLED)
                    .value("true")
                    .description("Controls whether OTP email verification is required during user registration")
                    .build();
            siteSettingRepository.save(otpSetting);
            log.info("Initialized default site setting: REGISTRATION_OTP_ENABLED = true");
        }

        // 3. Seed Sample Campaign Groups matching wireframe 2
        seedSampleGroups(admin1.getId());
        seedSampleGroups(admin2.getId());
    }

    private void seedSampleGroups(Long userId) {
        if (!accountGroupRepository.findByUserIdOrderByCreatedAtDesc(userId).isEmpty()) return;

        Object[][] sampleGroups = {
                {"Independence-Day", "ACTIVE", 12},
                {"Festival-Post", "ACTIVE", 18},
                {"Republic-Day", "ACTIVE", 15},
                {"Diwali-Campaign", "ACTIVE", 25},
                {"Christmas-Post", "INACTIVE", 10},
                {"New-Year-2026", "ACTIVE", 22},
                {"Product-Promotion", "ACTIVE", 30},
                {"Weekend-Content", "ACTIVE", 14},
                {"Special-Offers", "INACTIVE", 20},
                {"Monthly-Campaign", "ACTIVE", 35}
        };

        for (Object[] g : sampleGroups) {
            AccountGroup group = AccountGroup.builder()
                    .userId(userId)
                    .groupName((String) g[0])
                    .status((String) g[1])
                    .build();
            accountGroupRepository.save(group);
        }
        log.info("Seeded initial campaign groups matching wireframe 2 for userId={}", userId);
    }

    private User createOrUpdateAdminUser(String email) {
        User adminUser = userRepository.findByEmail(email).orElseGet(() -> User.builder()
                .email(email)
                .name("System Admin")
                .build());

        adminUser.setName("System Admin");
        adminUser.setPasswordHash(passwordEncoder.encode("admin"));
        adminUser.setRole("ADMIN");
        adminUser.setPlan(UserPlan.MASTER);
        adminUser.setAccountLimit(UserPlan.MASTER.getAccountLimit());
        adminUser.setEmailVerified(true);

        adminUser = userRepository.save(adminUser);
        log.info("Admin user ready: email={} password=admin role=ADMIN", email);
        return adminUser;
    }
}
