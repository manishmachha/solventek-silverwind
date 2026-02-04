package com.solventek.silverwind.onboarding;

import com.solventek.silverwind.common.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Onboarding management controller - Solventek only
 */
@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;

    @PostMapping("/application/{applicationId}/initiate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Onboarding>> initiateOnboarding(@PathVariable UUID applicationId) {
        return ResponseEntity.ok(ApiResponse.success(onboardingService.initiateOnboarding(applicationId)));
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Onboarding>> uploadDocument(@PathVariable UUID id,
            @RequestBody UploadDocRequest request) {
        return ResponseEntity.ok(ApiResponse.success(onboardingService.uploadDocument(id, request.getDocumentUrl())));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Onboarding>> completeOnboarding(@PathVariable UUID id,
            @RequestBody CompleteRequest request) {
        return ResponseEntity.ok(ApiResponse.success(onboardingService.completeOnboarding(id, request.getStartDate())));
    }

    @GetMapping("/application/{applicationId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Onboarding>> getByApplication(@PathVariable UUID applicationId) {
        return ResponseEntity.ok(ApiResponse.success(onboardingService.getOnboardingByApplication(applicationId)));
    }

    @Data
    public static class UploadDocRequest {
        private String documentUrl;
    }

    @Data
    public static class CompleteRequest {
        private LocalDate startDate;
    }
}
