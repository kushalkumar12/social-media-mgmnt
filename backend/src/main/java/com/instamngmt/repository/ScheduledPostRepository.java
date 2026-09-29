package com.instamngmt.repository;

import com.instamngmt.entity.PostStatus;
import com.instamngmt.entity.ScheduledPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduledPostRepository extends JpaRepository<ScheduledPost, Long> {
    List<ScheduledPost> findByUserIdOrderByScheduledAtDesc(Long userId);
    Optional<ScheduledPost> findByIdAndUserId(Long id, Long userId);
    Optional<ScheduledPost> findByIdempotencyKey(String idempotencyKey);

    List<ScheduledPost> findByUserIdAndScheduledAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT p FROM ScheduledPost p WHERE p.status = :status AND p.scheduledAt <= :now")
    List<ScheduledPost> findDuePosts(@Param("status") PostStatus status, @Param("now") LocalDateTime now);

    long countByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, PostStatus status);
}
