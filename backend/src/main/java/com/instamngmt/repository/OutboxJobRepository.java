package com.instamngmt.repository;

import com.instamngmt.entity.OutboxJob;
import com.instamngmt.entity.OutboxJobStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OutboxJobRepository extends JpaRepository<OutboxJob, Long> {
    
    @Query("SELECT j FROM OutboxJob j WHERE j.status = :status AND j.scheduledAt <= :now ORDER BY j.scheduledAt ASC")
    List<OutboxJob> findDueJobs(@Param("status") OutboxJobStatus status, @Param("now") LocalDateTime now, Pageable pageable);

    List<OutboxJob> findByScheduledPostId(Long scheduledPostId);
}
