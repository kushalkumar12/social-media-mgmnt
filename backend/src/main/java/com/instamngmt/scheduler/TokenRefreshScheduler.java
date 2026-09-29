package com.instamngmt.scheduler;

import com.instamngmt.entity.AccountStatus;
import com.instamngmt.entity.InstagramAccount;
import com.instamngmt.repository.InstagramAccountRepository;
import com.instamngmt.service.InstagramAuthService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class TokenRefreshScheduler {

    private static final Logger log = LoggerFactory.getLogger(TokenRefreshScheduler.class);

    private final InstagramAccountRepository instagramAccountRepository;
    private final InstagramAuthService instagramAuthService;

    public TokenRefreshScheduler(InstagramAccountRepository instagramAccountRepository, InstagramAuthService instagramAuthService) {
        this.instagramAccountRepository = instagramAccountRepository;
        this.instagramAuthService = instagramAuthService;
    }

    @Scheduled(cron = "0 0 2 * * *") // Daily at 2:00 AM
    @SchedulerLock(name = "token_refresh_lock", lockAtMostFor = "30m")
    public void refreshExpiringTokens() {
        LocalDateTime cutoff = LocalDateTime.now().plusDays(10); // Tokens expiring within 10 days
        List<InstagramAccount> expiringAccounts = instagramAccountRepository.findExpiringTokens(AccountStatus.ACTIVE, cutoff);

        log.info("Found {} Instagram accounts with tokens expiring within 10 days", expiringAccounts.size());
        for (InstagramAccount account : expiringAccounts) {
            try {
                instagramAuthService.refreshAccountToken(account.getId());
                log.info("Successfully refreshed token for account: {}", account.getUsername());
            } catch (Exception e) {
                log.error("Failed to refresh token for account: {}", account.getUsername(), e);
            }
        }
    }
}
