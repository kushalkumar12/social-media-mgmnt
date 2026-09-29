package com.fakeinstagram.service;

import com.fakeinstagram.dto.StatsResponse;
import com.fakeinstagram.entity.FakeAccount;
import com.fakeinstagram.entity.FakeToken;
import com.fakeinstagram.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class FakeAccountService {

    private final FakeAccountRepository fakeAccountRepository;
    private final FakeTokenRepository fakeTokenRepository;
    private final FakeMediaContainerRepository fakeMediaContainerRepository;
    private final FakePublishedMediaRepository fakePublishedMediaRepository;
    private final FakeCommentRepository fakeCommentRepository;
    private final FakeTokenService fakeTokenService;
    private final SimulationStateService simulationStateService;

    public FakeAccountService(
            FakeAccountRepository fakeAccountRepository,
            FakeTokenRepository fakeTokenRepository,
            FakeMediaContainerRepository fakeMediaContainerRepository,
            FakePublishedMediaRepository fakePublishedMediaRepository,
            FakeCommentRepository fakeCommentRepository,
            FakeTokenService fakeTokenService,
            SimulationStateService simulationStateService) {
        this.fakeAccountRepository = fakeAccountRepository;
        this.fakeTokenRepository = fakeTokenRepository;
        this.fakeMediaContainerRepository = fakeMediaContainerRepository;
        this.fakePublishedMediaRepository = fakePublishedMediaRepository;
        this.fakeCommentRepository = fakeCommentRepository;
        this.fakeTokenService = fakeTokenService;
        this.simulationStateService = simulationStateService;
    }

    public Optional<FakeAccount> findById(Long id) {
        return fakeAccountRepository.findById(id);
    }

    public Optional<FakeAccount> findByIgUserId(String igUserId) {
        if (igUserId == null) return Optional.empty();
        return fakeAccountRepository.findByIgUserId(igUserId.trim());
    }

    public Optional<FakeAccount> findByUsername(String username) {
        if (username == null) return Optional.empty();
        return fakeAccountRepository.findByUsername(username.trim());
    }

    public Page<FakeAccount> searchAccounts(String query, Pageable pageable) {
        return fakeAccountRepository.searchAccounts(query, pageable);
    }

    /**
     * Resolves the target Instagram account from either the URL target (ID or "me") and access token.
     */
    public Optional<FakeAccount> resolveAccount(String target, String token) {
        String cleanTarget = target != null ? target.trim() : "me";

        // If target is "me" or empty, resolve via token
        if ("me".equalsIgnoreCase(cleanTarget) || cleanTarget.isBlank()) {
            if (token != null && !token.isBlank()) {
                Optional<FakeToken> tokenOpt = fakeTokenRepository.findByToken(token.trim());
                if (tokenOpt.isPresent()) {
                    return fakeAccountRepository.findByIgUserId(tokenOpt.get().getIgUserId());
                }
            }
            // Fallback to first available account if present
            return fakeAccountRepository.findAll().stream().findFirst();
        }

        // If target is a numeric ID
        Optional<FakeAccount> byId = fakeAccountRepository.findByIgUserId(cleanTarget);
        if (byId.isPresent()) {
            return byId;
        }

        // If target matches a username
        Optional<FakeAccount> byUser = fakeAccountRepository.findByUsername(cleanTarget);
        if (byUser.isPresent()) {
            return byUser;
        }

        // Auto-provision fallback if strict mode is disabled
        if (!simulationStateService.isTokenValidationStrict()) {
            FakeAccount generated = FakeAccount.builder()
                    .igUserId(cleanTarget)
                    .username("creator_" + cleanTarget)
                    .name("Creator " + cleanTarget)
                    .followersCount(1500)
                    .followingCount(250)
                    .mediaCount(12)
                    .biography("Auto-generated test creator")
                    .accountType("BUSINESS")
                    .status("ACTIVE")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            return Optional.of(fakeAccountRepository.save(generated));
        }

        return Optional.empty();
    }

    @Transactional
    public FakeAccount createAccount(FakeAccount account) {
        if (account.getIgUserId() == null || account.getIgUserId().isBlank()) {
            account.setIgUserId(String.format("178414%011d", System.currentTimeMillis() % 100000000000L));
        }
        FakeAccount saved = fakeAccountRepository.save(account);

        // Generate a default valid token for it
        String tokenStr = String.format("EAAG_fake_token_%s_%04d", saved.getIgUserId(), (int)(Math.random() * 9000 + 1000));
        FakeToken token = FakeToken.builder()
                .token(tokenStr)
                .igUserId(saved.getIgUserId())
                .status("VALID")
                .expiresAt(LocalDateTime.now().plusDays(60))
                .build();
        fakeTokenRepository.save(token);

        return saved;
    }

    @Transactional
    public void deleteAccount(Long id) {
        fakeAccountRepository.findById(id).ifPresent(acc -> {
            fakeTokenRepository.deleteByIgUserId(acc.getIgUserId());
            fakePublishedMediaRepository.deleteByIgUserId(acc.getIgUserId());
            fakeAccountRepository.delete(acc);
        });
    }

    public StatsResponse getStats() {
        long totalAccounts = fakeAccountRepository.count();
        long totalTokens = fakeTokenRepository.count();
        long totalContainers = fakeMediaContainerRepository.count();
        long totalPublished = fakePublishedMediaRepository.count();
        long totalComments = fakeCommentRepository.count();

        return StatsResponse.builder()
                .totalAccounts(totalAccounts)
                .totalTokens(totalTokens)
                .totalActiveTokens(totalTokens) // approximate
                .totalExpiredTokens(0)
                .totalContainers(totalContainers)
                .totalPublishedMedia(totalPublished)
                .totalComments(totalComments)
                .totalApiRequests(simulationStateService.getTotalApiRequests())
                .totalErrorResponses(simulationStateService.getTotalErrorResponses())
                .averageLatencyMs(simulationStateService.getAverageLatencyMs())
                .activeScenario(simulationStateService.getActiveScenario())
                .activeSimulationConfig(simulationStateService.getCurrentConfig())
                .build();
    }
}
