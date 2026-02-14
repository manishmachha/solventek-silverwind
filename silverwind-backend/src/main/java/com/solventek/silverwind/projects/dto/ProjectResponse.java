package com.solventek.silverwind.projects.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for Project response
 */
@Data
@Builder
public class ProjectResponse {
    private UUID id;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private com.solventek.silverwind.dto.ClientSummary client;
    private OrganizationSummary internalOrg;
}
