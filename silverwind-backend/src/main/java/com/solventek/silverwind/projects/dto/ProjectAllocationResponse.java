package com.solventek.silverwind.projects.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for ProjectAllocation response
 */
@Data
@Builder
public class ProjectAllocationResponse {
    private UUID id;
    private UUID projectId;
    private String projectName;
    private UserSummary user;
    private com.solventek.silverwind.dto.ClientSummary candidate; // Using ClientSummary structure or creating
                                                                  // CandidateSummary?
    // Wait, Candidate has different fields. Let's reuse UserSummary or create
    // CandidateSummary.
    // UserSummary has firstName, lastName, email, profilePhotoUrl. Candidate has
    // similar.
    // Let's use UserSummary for candidate too, or a specific CandidateSummary.
    // Candidate has properties similar to User. Let's use UserSummary for now as it
    // fits (name, photo, email).
    private com.solventek.silverwind.projects.dto.UserSummary candidateDetails;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer allocationPercentage;
    private String billingRole;
    private String status;
}
