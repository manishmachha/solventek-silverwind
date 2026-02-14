package com.solventek.silverwind.projects.dto;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.client.Client;
import com.solventek.silverwind.dto.ClientSummary;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.recruitment.Candidate;
import com.solventek.silverwind.projects.Project;
import com.solventek.silverwind.projects.ProjectAllocation;
import com.solventek.silverwind.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Mapper utility for converting Project entities to DTOs
 */
@Component
@RequiredArgsConstructor
public class ProjectMapper {

    private final StorageService storageService;

    public ProjectResponse toProjectResponse(Project project) {
        if (project == null)
            return null;

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .status(project.getStatus() != null ? project.getStatus().name() : null)
                .client(toClientSummary(project.getClient()))
                .internalOrg(toOrganizationSummary(project.getInternalOrg()))
                .build();
    }

    public ProjectAllocationResponse toAllocationResponse(ProjectAllocation allocation) {
        if (allocation == null)
            return null;

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
                .status(allocation.getStatus() != null ? allocation.getStatus().name() : null)
                .candidateDetails(toCandidateSummary(allocation.getCandidate()))
                .build();
    }

    public ClientSummary toClientSummary(Client client) {
        if (client == null)
            return null;
        return ClientSummary.builder()
                .id(client.getId())
                .name(client.getName())
                .logoUrl(client.getLogoUrl())
                .industry(client.getIndustry())
                .build();
    }

    public UserSummary toCandidateSummary(Candidate candidate) {
        if (candidate == null)
            return null;
        return UserSummary.builder()
                .id(candidate.getId())
                .firstName(candidate.getFirstName())
                .lastName(candidate.getLastName())
                .email(candidate.getEmail())
                // Candidate doesn't have profilePhotoUrl in the entity snippet I saw, likely no
                // photo or different field.
                // Checking Candidate.java... it has resume fields but no explicit photo url.
                // Leaving photoUrl null or maybe we can add it to Candidate later.
                .build();
    }

    public OrganizationSummary toOrganizationSummary(Organization org) {
        if (org == null)
            return null;

        String logoUrl = org.getLogoUrl();
        if (logoUrl != null && !logoUrl.isBlank()) {
            try {
                // If it looks like a raw S3 key (doesn't start with / or http), or follows
                // /api/files convention
                String key = logoUrl;
                if (logoUrl.startsWith("/api/files/")) {
                    key = logoUrl.replace("/api/files/", "");
                }

                // Only sign if it's not already a full URL (http/https)
                if (!logoUrl.startsWith("http")) {
                    logoUrl = storageService.getPresignedUrl(key, java.time.Duration.ofMinutes(60));
                }
            } catch (Exception e) {
                // Keep original if signing fails
            }
        }

        return OrganizationSummary.builder()
                .id(org.getId())
                .name(org.getName())
                .type(org.getType() != null ? org.getType().name() : null)
                .logoUrl(logoUrl)
                .build();
    }

    public UserSummary toUserSummary(Employee employee) {
        if (employee == null)
            return null;

        String photoUrl = employee.getProfilePhotoUrl();
        if (photoUrl != null && photoUrl.startsWith("/api/files/")) {
            try {
                // Extract key from standard path
                String key = photoUrl.replace("/api/files/", "");
                // Generate presigned URL (valid for 60 mins by default)
                String presignedUrl = storageService.getPresignedUrl(key, java.time.Duration.ofMinutes(60));
                photoUrl = presignedUrl;
            } catch (Exception e) {
                // If presigning fails, keep original
            }
        }

        return UserSummary.builder()
                .id(employee.getId())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .email(employee.getEmail())
                .profilePhotoUrl(photoUrl)
                .build();
    }
}
