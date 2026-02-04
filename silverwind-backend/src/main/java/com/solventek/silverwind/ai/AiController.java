package com.solventek.silverwind.ai;

import com.solventek.silverwind.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * AI features controller - Solventek admins only
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/jobs/{jobId}/enrich")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> enrichJob(@PathVariable UUID jobId) {
        return ResponseEntity.ok(ApiResponse.success(aiService.enrichJob(jobId)));
    }

    @PostMapping("/applications/{applicationId}/ingest-resume")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Void>> ingestResume(@PathVariable UUID applicationId) {
        aiService.ingestResume(applicationId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/jobs/{jobId}/match")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<List<AiService.ApplicationMatch>>> matchCandidates(@PathVariable UUID jobId) {
        return ResponseEntity.ok(ApiResponse.success(aiService.matchCandidates(jobId)));
    }
}
