package com.solventek.silverwind.projects.dto;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.projects.Project;
import com.solventek.silverwind.projects.ProjectAllocation;
import org.springframework.stereotype.Component;

/**
 * Mapper utility for converting Project entities to DTOs
 */
@Component
public class ProjectMapper {

    public ProjectResponse toProjectResponse(Project project) {
        if (project == null) return null;

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .status(project.getStatus() != null ? project.getStatus().name() : null)
                .client(toOrganizationSummary(project.getClient()))
                .internalOrg(toOrganizationSummary(project.getInternalOrg()))
                .build();
    }

    public ProjectAllocationResponse toAllocationResponse(ProjectAllocation allocation) {
        if (allocation == null) return null;

        return ProjectAllocationResponse.builder()
                .id(allocation.getId())
                .projectId(allocation.getProject() != null ? allocation.getProject().getId() : null)
                .projectName(allocation.getProject() != null ? allocation.getProject().getName() : null)
                .user(toUserSummary(allocation.getEmployee()))
                .startDate(allocation.getStartDate())
                .endDate(allocation.getEndDate())
                .allocationPercentage(allocation.getAllocationPercentage())
                .billingRole(allocation.getBillingRole())
                .status(allocation.getStatus() != null ? allocation.getStatus().name() : null)
                .build();
    }

    public OrganizationSummary toOrganizationSummary(Organization org) {
        if (org == null) return null;

        return OrganizationSummary.builder()
                .id(org.getId())
                .name(org.getName())
                .type(org.getType() != null ? org.getType().name() : null)
                .build();
    }

    public UserSummary toUserSummary(Employee employee) {
        if (employee == null) return null;

        return UserSummary.builder()
                .id(employee.getId())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .email(employee.getEmail())
                .profilePhotoUrl(employee.getProfilePhotoUrl())
                .build();
    }
}
