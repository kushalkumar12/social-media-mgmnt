package com.fakeinstagram.repository;

import com.fakeinstagram.entity.FakeMediaContainer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FakeMediaContainerRepository extends JpaRepository<FakeMediaContainer, Long> {

    Optional<FakeMediaContainer> findByContainerId(String containerId);

    boolean existsByContainerId(String containerId);
}
