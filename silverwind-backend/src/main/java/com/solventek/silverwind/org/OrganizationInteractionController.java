package com.solventek.silverwind.org;

import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.jobs.Job;
import com.solventek.silverwind.jobs.JobRepository;
import com.solventek.silverwind.jobs.JobStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Organization interaction endpoints.
 * Partnership features have been removed.
 */
@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationInteractionController {

    private final OrganizationService organizationService;
    private final JobRepository jobRepository;

    @GetMapping("/discovery")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<List<Organization>>> getApprovedOrganizations() {
        return ResponseEntity.ok(ApiResponse.success(organizationService.getSolventekApprovedOrganizations()));
    }

    @GetMapping("/{id}/public-jobs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<List<Job>>> getOrganizationPublicJobs(@PathVariable UUID id) {
        // Only return PUBLISHED jobs
        List<Job> jobs = jobRepository.findByOrganizationIdAndStatus(id, JobStatus.PUBLISHED);
        return ResponseEntity.ok(ApiResponse.success(jobs));
    }
}
