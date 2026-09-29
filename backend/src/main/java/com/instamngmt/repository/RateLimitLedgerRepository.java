package com.instamngmt.repository;

import com.instamngmt.entity.RateLimitLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RateLimitLedgerRepository extends JpaRepository<RateLimitLedger, Long> {
    Optional<RateLimitLedger> findByInstagramAccountId(Long instagramAccountId);
}
