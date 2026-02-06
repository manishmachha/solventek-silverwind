package com.solventek.silverwind.jobs;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.solventek.silverwind.common.BaseEntity;
import com.solventek.silverwind.org.Organization;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.Map;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Job extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Organization organization;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(columnDefinition = "TEXT")
    private String rolesAndResponsibilities;

    private String experience; // e.g. "5+ years", "Junior"

    @Column(columnDefinition = "TEXT")
    private String skills; // Comma separated or JSON. Using Text for simplicity.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status;

    @Enumerated(EnumType.STRING)
    private com.solventek.silverwind.enums.EmploymentType employmentType; // FTE, C2H, CONTRACT

    private BigDecimal billRate;
    private BigDecimal payRate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ai_insights", columnDefinition = "jsonb")
    private Map<String, Object> aiInsights;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.applications.JobApplication> applications;
}
