package com.solventek.silverwind.jobs;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.org.OrganizationType;
import com.solventek.silverwind.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Job management controller.
 * Only Solventek can create/manage jobs.
 * Vendors can view published jobs.
 */
@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    /**
     * Create a new job - SOLVENTEK ONLY
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Job>> createJob(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody @Valid CreateJobRequest request) {
        
        // Verify Solventek org type
        if (!OrganizationType.SOLVENTEK.name().equals(currentUser.getOrgType())) {
            throw new AccessDeniedException(
                "Only Solventek can create jobs");
        }
        
        return ResponseEntity.ok(ApiResponse.success("Job created successfully.",
                jobService.createJob(
                        currentUser.getOrgId(),
                        request.getTitle(),
                        request.getDescription(),
                        request.getEmploymentType(),
                        request.getRequirements(),
                        request.getRolesAndResponsibilities(),
                        request.getExperience(),
                        request.getSkills(),
                        request.getBillRate(),
                        request.getPayRate(),
                        request.getStatus())));
    }

    /**
     * List all jobs - Solventek admins see all
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<Page<Job>>> listJobs(
            @AuthenticationPrincipal UserPrincipal currentUser,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(jobService.getAllJobs(pageable)));
    }

    /**
     * List published jobs - Vendors can access this
     */
    @GetMapping("/published")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<Page<Job>>> listPublishedJobs(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(jobService.getPublishedJobs(pageable)));
    }

    /**
     * Get single job details
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<Job>> getJob(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(jobService.getJob(id)));
    }

    /**
     * Change job status - Solventek only
     */
    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Job>> changeStatus(
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Job status updated successfully.",
                jobService.updateStatus(id, request.getStatus(), currentUser.getId(), request.getMessage())));
    }

    @Data
    public static class CreateJobRequest {
        @NotBlank
        private String title;
        private String description;
        @JsonProperty("employmentType")
        private String employmentType;
        private String requirements;
        private String rolesAndResponsibilities;
        private String experience;
        private String skills;
        private BigDecimal billRate;
        private BigDecimal payRate;
        private String status; // DRAFT or SUBMITTED
    }

    @Data
    public static class UpdateStatusRequest {
        private JobStatus status;
        private String message;
    }

    /**
     * Update job - Solventek only
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Job>> updateJob(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateJobRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Job updated successfully.",
                jobService.updateJob(id, request.getTitle(), request.getDescription(), request.getEmploymentType(),
                        request.getBillRate(), request.getPayRate(), currentUser.getId())));
    }

    /**
     * Delete job - Solventek only
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Void>> deleteJob(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        jobService.deleteJob(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Job deleted successfully.", null));
    }

    @Data
    public static class UpdateJobRequest {
        @NotBlank
        private String title;
        private String description;
        @JsonProperty("type")
        private String employmentType;
        private BigDecimal billRate;
        private BigDecimal payRate;
    }

    /**
     * Verify job - Solventek only
     */
    @PostMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Job>> verifyJob(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Job verified successfully.", jobService.verifyJob(id, currentUser.getId())));
    }

    /**
     * Enrich job with AI - Solventek only
     */
    @PostMapping("/{id}/enrich")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Job>> enrichJob(
            @PathVariable UUID id,
            @RequestBody @Valid EnrichJobRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Job enriched with AI successfully.",
                jobService.enrichJob(id, request.getRequirements(), request.getRolesAndResponsibilities(),
                        request.getExperience(), request.getSkills(), currentUser.getId())));
    }

    /**
     * Approve job - Solventek only
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Job>> approveJob(
            @PathVariable UUID id,
            @RequestBody @Valid ApproveJobRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Job approved successfully.",
                jobService.approveJob(id, request.getBillRate(), request.getPayRate(), currentUser.getId())));
    }

    /**
     * Publish job - Solventek only
     */
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Job>> publishJob(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Job published successfully.", jobService.publishJob(id, currentUser.getId())));
    }

    @Data
    public static class EnrichJobRequest {
        @NotBlank
        private String requirements;
        @NotBlank
        private String rolesAndResponsibilities;
        @NotBlank
        private String experience;
        @NotBlank
        private String skills;
    }

    @Data
    public static class ApproveJobRequest {
        private BigDecimal billRate;
        private BigDecimal payRate;
    }
}
