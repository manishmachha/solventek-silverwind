package com.solventek.silverwind.applications;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.solventek.silverwind.common.BaseEntity;
import com.solventek.silverwind.jobs.Job;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.recruitment.Candidate;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "job_applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class JobApplication extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Job job;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private String email;

    private String phone;
    private String resumeUrl;

    private java.time.LocalDate dob;

    private String currentTitle;
    private String currentCompany;
    private Double experienceYears;

    private String linkedinUrl;
    private String portfolioUrl;

    @ElementCollection
    private List<String> skills;

    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_org_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Organization vendor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    private String resumeFilePath;

    @Column(columnDefinition = "TEXT")
    private String resumeText; // Extracted text for AI analysis

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Candidate candidate;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.interviews.Interview> interviews;

    private Integer unreadCountForAdmin;

    @OneToOne(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private com.solventek.silverwind.onboarding.Onboarding onboarding;
}
