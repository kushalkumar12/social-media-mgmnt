package com.fakeinstagram.repository;

import com.fakeinstagram.entity.FakeComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FakeCommentRepository extends JpaRepository<FakeComment, Long> {

    Optional<FakeComment> findByCommentId(String commentId);

    Page<FakeComment> findByMediaIdOrderByTimestampDesc(String mediaId, Pageable pageable);

    void deleteByMediaId(String mediaId);
}
