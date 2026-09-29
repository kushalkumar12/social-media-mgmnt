package com.fakeinstagram.repository;

import com.fakeinstagram.entity.FakeAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FakeAccountRepository extends JpaRepository<FakeAccount, Long> {

    Optional<FakeAccount> findByIgUserId(String igUserId);

    Optional<FakeAccount> findByUsername(String username);

    boolean existsByIgUserId(String igUserId);

    boolean existsByUsername(String username);

    @Query("SELECT a FROM FakeAccount a WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           "LOWER(a.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "a.igUserId LIKE CONCAT('%', :query, '%'))")
    Page<FakeAccount> searchAccounts(@Param("query") String query, Pageable pageable);

    @Query("SELECT MAX(a.id) FROM FakeAccount a")
    Long findMaxId();
}
