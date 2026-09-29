package com.instamngmt.repository;

import com.instamngmt.entity.BulkImportBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BulkImportBatchRepository extends JpaRepository<BulkImportBatch, Long> {
    List<BulkImportBatch> findByUserIdOrderByCreatedAtDesc(Long userId);
}
