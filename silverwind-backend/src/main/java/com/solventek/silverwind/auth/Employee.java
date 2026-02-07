package com.solventek.silverwind.auth;

import com.solventek.silverwind.auth.embeddable.Address;
import com.fasterxml.jackson.annotation.JsonIgnore;

import com.solventek.silverwind.auth.embeddable.BankDetails;
import com.solventek.silverwind.auth.embeddable.EmergencyContact;
import com.solventek.silverwind.common.BaseEntity;
import com.solventek.silverwind.enums.EmploymentStatus;
import com.solventek.silverwind.enums.EmploymentType;
import com.solventek.silverwind.enums.Gender;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.rbac.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(unique = true)
    private String employeeCode;

    private String phone;
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(length = 2048)
    private String profilePhotoUrl;

    private LocalDate dateOfJoining;
    private LocalDate dateOfExit;

    @Enumerated(EnumType.STRING)
    private EmploymentStatus employmentStatus;

    private String department;
    private String designation;

    @Enumerated(EnumType.STRING)
    private EmploymentType employmentType;

    private String workLocation;
    private String gradeLevel;

    // RBAC Hierarchy - self-referencing for manager
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Column(unique = true)
    private String username;

    // Security
    @Builder.Default
    private Boolean enabled = true;
    @Builder.Default
    private Boolean accountLocked = false;
    @Builder.Default
    private Integer failedLoginAttempts = 0;
    private Instant lockUntil;
    private Instant lastLoginAt;
    private Instant passwordUpdatedAt;

    // Embeddables
    @Embedded
    private Address address;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "contactName", column = @Column(name = "emergency_contact_name")),
            @AttributeOverride(name = "relationship", column = @Column(name = "emergency_contact_relationship")),
            @AttributeOverride(name = "contactPhone", column = @Column(name = "emergency_contact_phone")),
            @AttributeOverride(name = "contactEmail", column = @Column(name = "emergency_contact_email"))
    })
    private EmergencyContact emergencyContact;

    @Embedded
    private BankDetails bankDetails;

    private String taxIdPan;

    private String createdBy;
    private String updatedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;

    public String getFullName() {
        return firstName + " " + lastName;
    }

    // --- Inverse Relationships (Cascades) ---

    @OneToMany(mappedBy = "manager", cascade = CascadeType.ALL)
    @JsonIgnore
    private java.util.List<Employee> directReports;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.feature.leave.entity.LeaveRequest> leaveRequests;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.org.Attendance> attendanceRecords;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.projects.ProjectAllocation> projectAllocations;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.org.EmployeeAssetAssignment> assetAssignments;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.org.Payroll> payrolls;

    @OneToOne(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private com.solventek.silverwind.org.SalaryStructure salaryStructure;

    @OneToMany(mappedBy = "recipient", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.notifications.Notification> notifications;

    // --- Profile Section ---

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.feature.profile.entity.Document> documents;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.feature.profile.entity.Education> education;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.feature.profile.entity.Certification> certifications;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.feature.profile.entity.WorkExperience> workExperience;

    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private java.util.List<com.solventek.silverwind.feature.profile.entity.Skill> skills;
}
