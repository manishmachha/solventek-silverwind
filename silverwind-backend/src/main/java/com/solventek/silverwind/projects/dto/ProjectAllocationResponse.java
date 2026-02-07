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
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer allocationPercentage;
    private String billingRole;
    private String status;
}
