package com.solventek.silverwind.feature.profile.controller;

import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.feature.profile.entity.*;
import com.solventek.silverwind.feature.profile.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/employees/{employeeId}")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    // --- Documents ---
    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<List<Document>>> getDocuments(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.success(profileService.getDocuments(employeeId)));
    }

    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Document>> uploadDocument(
            @PathVariable UUID employeeId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type, // e.g., "Resume"
            @RequestParam(value = "name", required = false) String name) {
        if (file.getSize() > 1024 * 1024) {
             throw new org.springframework.web.multipart.MaxUploadSizeExceededException(1024 * 1024);
        }
        return ResponseEntity.ok(ApiResponse.success(profileService.uploadDocument(employeeId, file, type, name)));
    }

    @DeleteMapping("/documents/{documentId}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable UUID employeeId, @PathVariable UUID documentId) {
        profileService.deleteDocument(documentId);
        return ResponseEntity.ok(ApiResponse.success("Document deleted successfully", null));
    }

    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable UUID employeeId, @PathVariable UUID documentId) {
        Resource resource = profileService.downloadDocument(documentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    // --- Education ---
    @GetMapping("/education")
    public ResponseEntity<ApiResponse<List<Education>>> getEducation(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.success(profileService.getEducation(employeeId)));
    }

    @PostMapping("/education")
    public ResponseEntity<ApiResponse<Education>> addEducation(@PathVariable UUID employeeId, @RequestBody Education education) {
        return ResponseEntity.ok(ApiResponse.success(profileService.addEducation(employeeId, education)));
    }

    @DeleteMapping("/education/{educationId}")
    public ResponseEntity<ApiResponse<Void>> deleteEducation(@PathVariable UUID employeeId, @PathVariable UUID educationId) {
        profileService.deleteEducation(educationId);
        return ResponseEntity.ok(ApiResponse.success("Education deleted successfully", null));
    }

    // --- Certifications ---
    @GetMapping("/certifications")
    public ResponseEntity<ApiResponse<List<Certification>>> getCertifications(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.success(profileService.getCertifications(employeeId)));
    }

    @PostMapping("/certifications")
    public ResponseEntity<ApiResponse<Certification>> addCertification(@PathVariable UUID employeeId, @RequestBody Certification certification) {
        return ResponseEntity.ok(ApiResponse.success(profileService.addCertification(employeeId, certification)));
    }

    @DeleteMapping("/certifications/{certificationId}")
    public ResponseEntity<ApiResponse<Void>> deleteCertification(@PathVariable UUID employeeId, @PathVariable UUID certificationId) {
        profileService.deleteCertification(certificationId);
        return ResponseEntity.ok(ApiResponse.success("Certification deleted successfully", null));
    }

    // --- Work Experience ---
    @GetMapping("/work-experience")
    public ResponseEntity<ApiResponse<List<WorkExperience>>> getWorkExperience(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.success(profileService.getWorkExperience(employeeId)));
    }

    @PostMapping("/work-experience")
    public ResponseEntity<ApiResponse<WorkExperience>> addWorkExperience(@PathVariable UUID employeeId, @RequestBody WorkExperience experience) {
        return ResponseEntity.ok(ApiResponse.success(profileService.addWorkExperience(employeeId, experience)));
    }

    @DeleteMapping("/work-experience/{experienceId}")
    public ResponseEntity<ApiResponse<Void>> deleteWorkExperience(@PathVariable UUID employeeId, @PathVariable UUID experienceId) {
        profileService.deleteWorkExperience(experienceId);
        return ResponseEntity.ok(ApiResponse.success("Work experience deleted successfully", null));
    }

    // --- Skills ---
    @GetMapping("/skills")
    public ResponseEntity<ApiResponse<List<Skill>>> getSkills(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(ApiResponse.success(profileService.getSkills(employeeId)));
    }

    @PostMapping("/skills")
    public ResponseEntity<ApiResponse<Skill>> addSkill(@PathVariable UUID employeeId, @RequestBody Skill skill) {
        return ResponseEntity.ok(ApiResponse.success(profileService.addSkill(employeeId, skill)));
    }

    @DeleteMapping("/skills/{skillId}")
    public ResponseEntity<ApiResponse<Void>> deleteSkill(@PathVariable UUID employeeId, @PathVariable UUID skillId) {
        profileService.deleteSkill(skillId);
        return ResponseEntity.ok(ApiResponse.success("Skill deleted successfully", null));
    }
}
