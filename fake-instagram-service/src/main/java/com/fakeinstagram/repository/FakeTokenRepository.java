package com.fakeinstagram.repository;

import com.fakeinstagram.entity.FakeToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FakeTokenRepository extends JpaRepository<FakeToken, Long> {

    Optional<FakeToken> findByToken(String token);

    List<FakeToken> findByIgUserId(String igUserId);

    Optional<FakeToken> findFirstByIgUserIdAndStatusOrderByCreatedAtDesc(String igUserId, String status);

    boolean existsByToken(String token);

    void deleteByIgUserId(String igUserId);
}
