package com.solventek.silverwind.recruitment;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.org.OrganizationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class BrandedResumeController {

    private final BrandedResumeService brandedResumeService;
    private final EmployeeRepository employeeRepository;

    private Employee getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return employeeRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // === Global resume list ===

    @GetMapping("/branded-resumes")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<List<BrandedResume>>> getAll() {
        Employee user = getCurrentUser();
        List<BrandedResume> resumes;
        if (user.getOrganization().getType() == OrganizationType.SOLVENTEK) {
            resumes = brandedResumeService.getAll();
        } else {
            resumes = brandedResumeService.getAllForOrganization(user.getOrganization().getId());
        }
        return ResponseEntity.ok(ApiResponse.success(resumes));
    }

    @GetMapping("/branded-resumes/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<BrandedResume>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(brandedResumeService.getById(id)));
    }

    @GetMapping("/branded-resumes/{id}/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        BrandedResume br = brandedResumeService.getById(id);
        Resource resource = brandedResumeService.download(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + br.getOriginalFileName() + "\"")
                .body(resource);
    }

    // === Candidate-scoped endpoints ===

    @GetMapping("/candidates/{candidateId}/branded-resumes")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<List<BrandedResume>>> getForCandidate(@PathVariable UUID candidateId) {
        return ResponseEntity.ok(ApiResponse.success(brandedResumeService.getVersions(candidateId)));
    }

    @GetMapping("/candidates/{candidateId}/branded-resumes/latest")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<BrandedResume>> getLatest(@PathVariable UUID candidateId) {
        return brandedResumeService.getLatest(candidateId)
                .map(br -> ResponseEntity.ok(ApiResponse.success(br)))
                .orElse(ResponseEntity.ok(ApiResponse.success(null)));
    }

    @GetMapping("/candidates/{candidateId}/branded-resumes/latest/download")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<Resource> downloadLatest(@PathVariable UUID candidateId) {
        BrandedResume br = brandedResumeService.getLatest(candidateId)
                .orElseThrow(() -> new RuntimeException("No branded resume found"));
        Resource resource = brandedResumeService.downloadLatest(candidateId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + br.getOriginalFileName() + "\"")
                .body(resource);
    }

    @PostMapping("/candidates/{candidateId}/branded-resumes/regenerate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<String>> regenerate(@PathVariable UUID candidateId) {
        log.info("Manual regeneration requested for candidate: {}", candidateId);
        brandedResumeService.generateBrandedResumeAsync(candidateId);
        return ResponseEntity
                .ok(ApiResponse.success("Branded resume generation started. You will be notified when it's ready."));
    }
}
