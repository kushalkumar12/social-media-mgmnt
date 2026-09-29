package com.instamngmt.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "bulk_import_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkImportBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String fileName;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(columnDefinition = "BYTEA", nullable = false)
    private byte[] fileData;

    @Builder.Default
    private Integer totalRows = 0;

    @Builder.Default
    private Integer validRows = 0;

    @Builder.Default
    private Integer errorRows = 0;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PREVIEW";

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
