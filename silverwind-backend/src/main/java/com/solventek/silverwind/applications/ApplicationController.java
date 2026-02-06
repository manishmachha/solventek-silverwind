package com.solventek.silverwind.applications;

import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.security.UserPrincipal;
import com.solventek.silverwind.timeline.TimelineEvent;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * Application management controller.
 * Solventek (SUPER_ADMIN, TA) manages applications.
 * Vendors can submit applications for jobs.
 */
@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping(value = "/jobs/{jobId}/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<JobApplication>> apply(
            @PathVariable UUID jobId,
            @RequestPart("data") ApplyRequest request,
            @RequestPart(value = "resume", required = false) MultipartFile resume,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Application submitted successfully.",
                applicationService.apply(jobId, request, resume, currentUser.getOrgId())));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','HR_ADMIN','TA')")
    public ResponseEntity<ApiResponse<JobApplication>> updateStatus(
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Application status updated.",
                applicationService.updateStatus(id, request.getStatus())));
    }

    @Data
    public static class ApplyRequest {
        @NotBlank
        private String firstName;
        @NotBlank
        private String lastName;
        @Email
        @NotBlank
        private String email;
        private String phone;
        private String resumeUrl;
        private String currentTitle;
        private String currentCompany;
        private Double experienceYears;
        private String linkedinUrl;
        private String portfolioUrl;
        private List<String> skills;
        private String location;
        private UUID candidateId;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Void>> deleteApplication(@PathVariable UUID id) {
        applicationService.withdrawApplication(id);
        return ResponseEntity.ok(ApiResponse.success("Application withdrawn successfully.", null));
    }

    @Data
    public static class UpdateStatusRequest {
        private ApplicationStatus status;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','HR_ADMIN','TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<Page<JobApplication>>> listApplications(
            @RequestParam(required = false) UUID jobId,
            @RequestParam(required = false, defaultValue = "INBOUND") String mode,
            @AuthenticationPrincipal UserPrincipal currentUser,
            Pageable pageable) {

        if (jobId != null) {
            return ResponseEntity.ok(ApiResponse.success(
                    applicationService.getApplicationsForJob(jobId, pageable)));
        }

        // For vendors, show outbound (their submitted apps)
        // For Solventek, show inbound (apps received)
        if ("OUTBOUND".equalsIgnoreCase(mode)) {
            return ResponseEntity.ok(ApiResponse.success(
                    applicationService.getOutboundApplications(currentUser.getOrgId(), pageable)));
        } else {
            return ResponseEntity.ok(ApiResponse.success(
                    applicationService.getInboundApplications(currentUser.getOrgId(), pageable)));
        }
    }

    @PostMapping("/{id}/decision")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<JobApplication>> makeDecision(
            @PathVariable UUID id,
            @RequestBody @Valid ClientDecisionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Decision recorded successfully.",
                applicationService.makeClientDecision(id, request.isApproved(), request.getFeedback())));
    }

    @GetMapping("/{id}/analysis")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','HR_ADMIN','TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<ResumeAnalysis>> getLatestAnalysis(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(applicationService.getLatestAnalysis(id)));
    }

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<Void>> uploadDocument(
            @PathVariable UUID id,
            @RequestParam("category") String category,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        applicationService.uploadDocument(id, category, file, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Document uploaded successfully.", null));
    }

    @GetMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','HR_ADMIN','TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<List<ApplicationDocuments>>> getDocuments(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(applicationService.getDocuments(id)));
    }

    @Data
    public static class ClientDecisionRequest {
        private boolean approved;
        private String feedback;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','HR_ADMIN','TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<JobApplication>> getApplicationDetails(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(applicationService.getApplication(id)));
    }

    @GetMapping("/{id}/timeline")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','HR_ADMIN','TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<Page<TimelineEvent>>> getTimeline(
            @PathVariable UUID id, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(applicationService.getTimeline(id, pageable)));
    }

    @PostMapping("/{id}/analysis")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Void>> triggerAnalysis(@PathVariable UUID id) {
        applicationService.triggerManualAnalysis(id);
        return ResponseEntity.ok(ApiResponse.success("Analysis triggered successfully.", null));
    }

    @GetMapping("/documents/{docId}/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<Resource> downloadDocument(@PathVariable UUID docId) {
        ApplicationDocuments doc = applicationService.getDocument(docId);
        Resource resource = applicationService.downloadDocumentResource(docId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + doc.getFileName() + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/resume/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<Resource> downloadResume(@PathVariable UUID id) {
        JobApplication app = applicationService.getApplication(id);
        if (app.getResumeFilePath() == null) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = applicationService.downloadResume(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"resume_" + app.getFirstName() + "_" + app.getLastName() + ".pdf\"")
                .body(resource);
    }

    @PostMapping("/{id}/timeline")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Void>> addTimelineEvent(
            @PathVariable UUID id,
            @RequestBody TimelineEventRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        applicationService.addTimelineEvent(id, request.getMessage(), request.getTitle(), currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Timeline event added successfully.", null));
    }

    @Data
    public static class TimelineEventRequest {
        private String message;
        private String title;
        private String action;
    }
}
