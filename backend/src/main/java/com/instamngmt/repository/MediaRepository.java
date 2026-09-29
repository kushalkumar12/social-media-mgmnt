package com.instamngmt.repository;

import com.instamngmt.entity.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MediaRepository extends JpaRepository<Media, Long> {
    List<Media> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Media> findByIdAndUserId(Long id, Long userId);
}
