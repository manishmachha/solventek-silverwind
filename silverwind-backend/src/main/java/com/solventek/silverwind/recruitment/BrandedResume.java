package com.solventek.silverwind.recruitment;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.solventek.silverwind.common.BaseEntity;
import com.solventek.silverwind.org.Organization;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "branded_resumes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class BrandedResume extends BaseEntity {

    public enum Status {
        GENERATING, COMPLETED, FAILED
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "applications", "organization" })
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Organization organization;

    @Column(nullable = false)
    private Integer version;

    @Column(nullable = false, length = 500)
    private String filePath;

    @Column(length = 255)
    private String originalFileName;

    @Column(length = 100)
    @Builder.Default
    private String contentType = "application/pdf";

    private Long fileSizeBytes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.GENERATING;

    @Column(columnDefinition = "LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    private String revampedContentJson;

    @Column(columnDefinition = "TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    private String generationNotes;
}
