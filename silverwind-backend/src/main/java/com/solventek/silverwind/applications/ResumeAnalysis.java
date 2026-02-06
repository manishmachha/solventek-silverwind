package com.solventek.silverwind.applications;

import com.solventek.silverwind.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "resume_analysis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeAnalysis extends BaseEntity {

    @Column(nullable = false)
    private UUID applicationId; // Loose coupling or ManyToOne? Let's use loose for now to avoid circular
                                          // deps, or update JobApplication to have OneToMany.
    // Actually looser coupling by ID is fine here, but usually a Join is better.
    // The reference used loose ID. I'll stick to ID for simplicity unless I need
    // traverse.

    private String model; // e.g., "gemini-pro"

    // Scores (0-100)
    private Integer overallRiskScore;
    private Integer overallConsistencyScore;
    private Integer verificationPriorityScore;

    private Integer timelineRiskScore;
    private Integer skillInflationRiskScore;
    private Integer projectCredibilityRiskScore;
    private Integer authorshipRiskScore;
    private Integer confidenceScore;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String redFlagsJson; // List of RedFlag objects

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String evidenceJson; // List of Evidence objects

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String interviewQuestionsJson; // Map<String, List<String>>

    @Builder.Default
    private Integer version = 1;

    private LocalDateTime analyzedAt;

    @PrePersist
    public void prePersist() {
        if (analyzedAt == null)
            analyzedAt = LocalDateTime.now();
    }
}
