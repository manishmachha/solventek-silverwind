package com.solventek.silverwind.auth.dto;

import com.solventek.silverwind.auth.embeddable.Address;
import com.solventek.silverwind.auth.embeddable.EmergencyContact;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Full employee response DTO matching frontend User interface.
 * Excludes sensitive fields: passwordHash, failedLoginAttempts, lockUntil
 */
@Data
@Builder
public class EmployeeResponse {
    // Basic Info
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;
    private String profilePhotoUrl;

    // Employment
    private String employeeCode;
    private String username;
    private LocalDate dateOfJoining;
    private LocalDate dateOfExit;
    private String employmentStatus;
    private String department;
    private String designation;
    private String employmentType;
    private String workLocation;
    private String gradeLevel;

    // Security (safe fields only)
    private Boolean enabled;
    private Boolean accountLocked;
    private java.time.Instant lastLoginAt;
    private java.time.Instant passwordUpdatedAt;

    // Embeddables
    private Address address;
    private EmergencyContact emergencyContact;
    private BankDetailsDto bankDetails; // Masked bank details
    private String taxIdPan;

    // Relationships (as DTOs)
    private ManagerSummary manager;
    private UUID managerId;
    private RoleDto role;
    private OrganizationDto organization;
    private UUID orgId;
    private String orgType;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
