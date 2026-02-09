package com.solventek.silverwind.public_api;

import com.solventek.silverwind.applications.ApplicationController;
import com.solventek.silverwind.applications.ApplicationService;
import com.solventek.silverwind.applications.JobApplication;
import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.jobs.Job;
import com.solventek.silverwind.jobs.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final JobService jobService;
    private final ApplicationService applicationService;

    @GetMapping("/jobs")
    public ResponseEntity<ApiResponse<Page<Job>>> getPublishedJobs(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(jobService.getPublishedJobs(pageable)));
    }

    @PostMapping(value = "/applications/jobs/{jobId}/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<JobApplication>> apply(
            @PathVariable UUID jobId,
            @RequestPart("data") ApplicationController.ApplyRequest request,
            @RequestPart(value = "resume", required = false) MultipartFile resume) {
        if (resume != null && resume.getSize() > 1024 * 1024) {
            throw new org.springframework.web.multipart.MaxUploadSizeExceededException(1024 * 1024);
        }
        
        // Pass null for vendorOrgId as this is a public application
        JobApplication app = applicationService.apply(jobId, request, resume, null);
        return ResponseEntity.ok(ApiResponse.success(app));
    }
}
