package com.solventek.silverwind.org;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.solventek.silverwind.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "organizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Organization extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrganizationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrganizationStatus status;

    // --- Company Details ---
    private String legalName; // Legal registered name
    private String registrationNumber; // CIN/GSTIN/Company Registration
    private String taxId; // Tax ID / PAN
    private String website;
    private String industry; // IT, Healthcare, Finance, etc.

    @Column(length = 2000)
    private String description; // Company description

    // --- Contact Information ---
    private String email; // Primary contact email
    private String phone; // Primary contact phone
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String postalCode;

    // --- Primary Contact Person ---
    private String contactPersonName;
    private String contactPersonEmail;
    private String contactPersonPhone;
    private String contactPersonDesignation;

    // --- Business Details ---
    private Integer employeeCount; // Number of employees
    private Integer yearsInBusiness; // Years of operation
    @Column(length = 1000)
    private String serviceOfferings; // Comma-separated services offered
    @Column(length = 1000)
    private String keyClients; // Notable clients (optional)

    // --- Documents ---
    @Column(length = 2048)
    private String logoUrl;
    @Column(length = 2048)
    private String registrationDocUrl; // Certificate of Incorporation
    @Column(length = 2048)
    private String taxDocUrl; // Tax registration document

    // --- Additional Metadata ---
    private String referralSource; // How did they find us
    private String notes; // Internal notes (Solventek admin)

    @com.fasterxml.jackson.annotation.JsonIgnore
    private String adminPasswordHash; // Temporary storage for admin password during registration

    // --- Inverse Relationships (Cascades) ---

    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.auth.Employee> employees;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.projects.Project> clientProjects;

    @OneToMany(mappedBy = "internalOrg", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.projects.Project> ownedProjects;

    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.jobs.Job> jobs;

    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.recruitment.Candidate> candidates;

    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<Asset> assets;

    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.rbac.Role> roles;

    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.org.Payroll> payrolls;

    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.org.SalaryStructure> salaryStructures;

    @OneToMany(mappedBy = "organization", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.timeline.TimelineEvent> timelineEvents;
}
