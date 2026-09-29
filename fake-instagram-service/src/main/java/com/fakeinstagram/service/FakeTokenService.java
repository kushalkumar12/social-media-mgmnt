package com.fakeinstagram.service;

import com.fakeinstagram.entity.FakeToken;
import com.fakeinstagram.repository.FakeTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class FakeTokenService {

    private final FakeTokenRepository fakeTokenRepository;
    private final SimulationStateService simulationStateService;

    public FakeTokenService(FakeTokenRepository fakeTokenRepository, SimulationStateService simulationStateService) {
        this.fakeTokenRepository = fakeTokenRepository;
        this.simulationStateService = simulationStateService;
    }

    public Optional<FakeToken> findToken(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        return fakeTokenRepository.findByToken(token.trim());
    }

    /**
     * Validates access token considering simulation scenarios and token lifecycle.
     */
    public TokenValidationResult validate(String token) {
        // If simulation forces token failure
        if ("TOKEN_FAILURE".equalsIgnoreCase(simulationStateService.getActiveScenario())) {
            return TokenValidationResult.expired("Scenario TOKEN_FAILURE active: Access token expired.");
        }

        if (token == null || token.isBlank()) {
            return TokenValidationResult.invalid("Missing or blank access token.");
        }

        String clean = token.trim();
        Optional<FakeToken> opt = fakeTokenRepository.findByToken(clean);

        if (opt.isPresent()) {
            FakeToken t = opt.get();
            if ("EXPIRED".equalsIgnoreCase(t.getStatus()) || t.isExpired()) {
                return TokenValidationResult.expired("Error validating access token: Session has expired.");
            }
            if ("REVOKED".equalsIgnoreCase(t.getStatus())) {
                return TokenValidationResult.revoked("Error validating access token: User has revoked access.");
            }
            if ("INVALID".equalsIgnoreCase(t.getStatus())) {
                return TokenValidationResult.invalid("Invalid OAuth access token signature.");
            }
            return TokenValidationResult.valid(t);
        }

        // If not in database, check strict mode
        if (simulationStateService.isTokenValidationStrict()) {
            return TokenValidationResult.invalid("Error validating access token: Token does not exist.");
        } else {
            // Flexible test mode: auto-create a valid token for convenience
            FakeToken dynamicToken = FakeToken.builder()
                    .token(clean)
                    .igUserId("17841400000000001")
                    .status("VALID")
                    .expiresAt(LocalDateTime.now().plusDays(60))
                    .build();
            return TokenValidationResult.valid(fakeTokenRepository.save(dynamicToken));
        }
    }

    @Transactional
    public boolean expireToken(String token) {
        Optional<FakeToken> opt = fakeTokenRepository.findByToken(token.trim());
        if (opt.isPresent()) {
            FakeToken t = opt.get();
            t.setStatus("EXPIRED");
            t.setExpiresAt(LocalDateTime.now().minusDays(1));
            fakeTokenRepository.save(t);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean revokeToken(String token) {
        Optional<FakeToken> opt = fakeTokenRepository.findByToken(token.trim());
        if (opt.isPresent()) {
            FakeToken t = opt.get();
            t.setStatus("REVOKED");
            fakeTokenRepository.save(t);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean restoreToken(String token) {
        Optional<FakeToken> opt = fakeTokenRepository.findByToken(token.trim());
        if (opt.isPresent()) {
            FakeToken t = opt.get();
            t.setStatus("VALID");
            t.setExpiresAt(LocalDateTime.now().plusDays(60));
            fakeTokenRepository.save(t);
            return true;
        }
        return false;
    }

    @Transactional
    public String refreshLongLivedToken(String oldToken) {
        String cleanOld = oldToken != null ? oldToken.trim() : "";
        Optional<FakeToken> opt = fakeTokenRepository.findByToken(cleanOld);
        String igUserId = opt.map(FakeToken::getIgUserId).orElse("17841400000000001");

        String newToken = String.format("EAAG_fake_refreshed_%s_%s", igUserId, UUID.randomUUID().toString().substring(0, 8));
        FakeToken fresh = FakeToken.builder()
                .token(newToken)
                .igUserId(igUserId)
                .status("VALID")
                .expiresAt(LocalDateTime.now().plusDays(60))
                .build();
        fakeTokenRepository.save(fresh);
        return newToken;
    }

    public record TokenValidationResult(boolean isValid, boolean isExpired, boolean isRevoked, String errorMessage, FakeToken token) {
        public static TokenValidationResult valid(FakeToken token) {
            return new TokenValidationResult(true, false, false, null, token);
        }
        public static TokenValidationResult expired(String msg) {
            return new TokenValidationResult(false, true, false, msg, null);
        }
        public static TokenValidationResult revoked(String msg) {
            return new TokenValidationResult(false, false, true, msg, null);
        }
        public static TokenValidationResult invalid(String msg) {
            return new TokenValidationResult(false, false, false, msg, null);
        }
    }
}
