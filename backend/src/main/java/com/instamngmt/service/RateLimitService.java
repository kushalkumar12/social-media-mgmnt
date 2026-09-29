package com.instamngmt.service;

import com.instamngmt.entity.RateLimitLedger;
import com.instamngmt.repository.RateLimitLedgerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class RateLimitService {

    private static final int MAX_PUBLISH_PER_24H = 100; // Meta publishing limit
    private final RateLimitLedgerRepository rateLimitLedgerRepository;

    public RateLimitService(RateLimitLedgerRepository rateLimitLedgerRepository) {
        this.rateLimitLedgerRepository = rateLimitLedgerRepository;
    }

    @Transactional
    public boolean canPublish(Long instagramAccountId) {
        RateLimitLedger ledger = rateLimitLedgerRepository.findByInstagramAccountId(instagramAccountId)
                .orElseGet(() -> RateLimitLedger.builder()
                        .instagramAccountId(instagramAccountId)
                        .attemptsInWindow(0)
                        .windowStart(LocalDateTime.now())
                        .lastUpdated(LocalDateTime.now())
                        .build());

        LocalDateTime now = LocalDateTime.now();
        // Reset 24-hour window if elapsed
        if (ledger.getWindowStart().plusHours(24).isBefore(now)) {
            ledger.setWindowStart(now);
            ledger.setAttemptsInWindow(0);
        }

        if (ledger.getAttemptsInWindow() >= MAX_PUBLISH_PER_24H) {
            return false;
        }

        return true;
    }

    @Transactional
    public void recordPublishAttempt(Long instagramAccountId) {
        RateLimitLedger ledger = rateLimitLedgerRepository.findByInstagramAccountId(instagramAccountId)
                .orElseGet(() -> RateLimitLedger.builder()
                        .instagramAccountId(instagramAccountId)
                        .attemptsInWindow(0)
                        .windowStart(LocalDateTime.now())
                        .lastUpdated(LocalDateTime.now())
                        .build());

        LocalDateTime now = LocalDateTime.now();
        if (ledger.getWindowStart().plusHours(24).isBefore(now)) {
            ledger.setWindowStart(now);
            ledger.setAttemptsInWindow(0);
        }

        ledger.setAttemptsInWindow(ledger.getAttemptsInWindow() + 1);
        rateLimitLedgerRepository.save(ledger);
    }
}
