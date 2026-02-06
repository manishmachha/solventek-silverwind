package com.solventek.silverwind.recruitment;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.solventek.silverwind.common.BaseEntity;
import com.solventek.silverwind.org.Organization;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "candidates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Candidate extends BaseEntity {

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private String email;

    private String phone;
    private String city;
    private String currentDesignation;
    private String currentCompany;
    private Double experienceYears;

    @ElementCollection
    private List<String> skills;

    @Column(columnDefinition = "TEXT")
    private String summary;

    private String linkedInUrl;
    private String portfolioUrl;

    // Resume File Details
    private String resumeFilePath;         // Internal storage path
    private String resumeOriginalFileName; // Original filename for display
    private String resumeContentType;      // MIME type

    // Parsed Details (JSON stored as text/jsonb depending on DB, using TEXT for simplicity)
    @Column(columnDefinition = "TEXT")
    private String experienceDetailsJson; // JSON array of experience

    @Column(columnDefinition = "TEXT")
    private String educationDetailsJson; // JSON array of education

    @Column(columnDefinition = "TEXT")
    private String aiAnalysisJson; // General AI Analysis Result

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Organization organization; // Vendor Organization that owns this candidate

    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.applications.JobApplication> applications;
}
