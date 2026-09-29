package com.fakeinstagram.repository;

import com.fakeinstagram.entity.FakePublishedMedia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FakePublishedMediaRepository extends JpaRepository<FakePublishedMedia, Long> {

    Optional<FakePublishedMedia> findByMediaId(String mediaId);

    Page<FakePublishedMedia> findByIgUserIdOrderByPublishedAtDesc(String igUserId, Pageable pageable);

    long countByIgUserId(String igUserId);

    void deleteByIgUserId(String igUserId);
}
