package com.instamngmt.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rate_limit_ledger")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RateLimitLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "instagram_account_id", nullable = false, unique = true)
    private Long instagramAccountId;

    @Column(nullable = false)
    private Integer attemptsInWindow = 0;

    @Column(nullable = false)
    private LocalDateTime windowStart;

    @Column(nullable = false)
    private LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.lastUpdated = LocalDateTime.now();
    }
}
