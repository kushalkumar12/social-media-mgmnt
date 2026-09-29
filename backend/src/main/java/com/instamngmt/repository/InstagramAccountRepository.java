package com.instamngmt.repository;

import com.instamngmt.entity.AccountStatus;
import com.instamngmt.entity.InstagramAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InstagramAccountRepository extends JpaRepository<InstagramAccount, Long> {
    List<InstagramAccount> findByUserId(Long userId);
    Optional<InstagramAccount> findByIdAndUserId(Long id, Long userId);
    Optional<InstagramAccount> findByIgUserId(String igUserId);

    @Query("SELECT a FROM InstagramAccount a WHERE a.status = :status AND a.tokenExpiresAt <= :cutoffDate")
    List<InstagramAccount> findExpiringTokens(@Param("status") AccountStatus status, @Param("cutoffDate") LocalDateTime cutoffDate);
}
