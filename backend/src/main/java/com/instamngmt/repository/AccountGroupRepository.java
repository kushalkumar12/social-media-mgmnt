package com.instamngmt.repository;

import com.instamngmt.entity.AccountGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountGroupRepository extends JpaRepository<AccountGroup, Long> {
    List<AccountGroup> findByUserIdOrderByCreatedAtDesc(Long userId);
}
