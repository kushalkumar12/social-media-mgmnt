package com.instamngmt.repository;

import com.instamngmt.entity.PostMediaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostMediaItemRepository extends JpaRepository<PostMediaItem, Long> {
    List<PostMediaItem> findByScheduledPostIdOrderByPositionAsc(Long scheduledPostId);
}
