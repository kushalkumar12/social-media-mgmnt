package com.instamngmt.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "account_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String groupName;

    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "account_group_members", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "instagram_account_id")
    @Builder.Default
    private Set<Long> accountIds = new HashSet<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
