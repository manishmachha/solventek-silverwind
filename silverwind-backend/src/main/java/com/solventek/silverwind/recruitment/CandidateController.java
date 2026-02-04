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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
@Slf4j
public class CandidateController {

    private final CandidateService candidateService;
    private final EmployeeRepository employeeRepository;

    private Employee getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return employeeRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<Candidate>> uploadResume(@RequestParam("file") MultipartFile file) {
        log.info("Received resume upload request: {}", file.getOriginalFilename());
        Employee user = getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(
                candidateService.createFromResume(file, user.getOrganization().getId())
        ));
    }

    @PostMapping(value = "/{id}/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<Candidate>> updateResume(@PathVariable UUID id, @RequestParam("file") MultipartFile file) {
        Candidate c = candidateService.getCandidate(id);
        Employee user = getCurrentUser();
        if (!c.getOrganization().getId().equals(user.getOrganization().getId())) {
             throw new RuntimeException("Access Denied");
        }
        return ResponseEntity.ok(ApiResponse.success(
                candidateService.updateResume(id, file)
        ));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<List<Candidate>>> getAllCandidates() {
        Employee user = getCurrentUser();
        // If Vendor, only show their candidates
        if (user.getOrganization().getType() == OrganizationType.VENDOR) {
            return ResponseEntity.ok(ApiResponse.success(
                    candidateService.getAllCandidates(user.getOrganization().getId())
            ));
        } else {
            // Solventek user can see all (or potentially filtered)
            return ResponseEntity.ok(ApiResponse.success(
                    candidateService.getAllCandidatesForAdmin()
            ));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<Candidate>> getCandidate(@PathVariable UUID id) {
        Candidate c = candidateService.getCandidate(id);
        // Security check: Vendor can only see their own
        Employee user = getCurrentUser();
        if (user.getOrganization().getType() == OrganizationType.VENDOR && 
            !c.getOrganization().getId().equals(user.getOrganization().getId())) {
             throw new RuntimeException("Access Denied");
        }
        return ResponseEntity.ok(ApiResponse.success(c));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<Candidate>> updateCandidate(@PathVariable UUID id, @RequestBody CandidateDTO.UpdateRequest request) {
        // Security check done in service usually, but let's do simple check here or service.
        // For simplicity, service method just updates. 
        // Ideally we check ownership here.
        Candidate c = candidateService.getCandidate(id);
        Employee user = getCurrentUser();
        if (!c.getOrganization().getId().equals(user.getOrganization().getId())) {
             throw new RuntimeException("Access Denied");
        }
        return ResponseEntity.ok(ApiResponse.success(candidateService.updateCandidate(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VENDOR')")
    public ResponseEntity<ApiResponse<Void>> deleteCandidate(@PathVariable UUID id) {
        Candidate c = candidateService.getCandidate(id);
        Employee user = getCurrentUser();
        if (!c.getOrganization().getId().equals(user.getOrganization().getId())) {
             throw new RuntimeException("Access Denied");
        }
        candidateService.deleteCandidate(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
    
    @GetMapping("/{id}/resume")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<Resource> downloadResume(@PathVariable UUID id) {
        Candidate c = candidateService.getCandidate(id);
        Employee user = getCurrentUser();
        if (user.getOrganization().getType() == OrganizationType.VENDOR && 
            !c.getOrganization().getId().equals(user.getOrganization().getId())) {
             throw new RuntimeException("Access Denied");
        }
        
        Resource resource = candidateService.getResumeFile(id);
        String filename = c.getResumeOriginalFileName();
        if(filename == null || filename.isBlank()) {
            filename = "resume.pdf"; 
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(c.getResumeContentType() != null ? c.getResumeContentType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }
}
