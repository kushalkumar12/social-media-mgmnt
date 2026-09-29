package com.instamngmt.repository;

import com.instamngmt.entity.SiteSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SiteSettingRepository extends JpaRepository<SiteSetting, String> {
    Optional<SiteSetting> findByKey(String key);
}
