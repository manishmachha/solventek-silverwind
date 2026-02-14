package com.solventek.silverwind.client.submission;

import com.solventek.silverwind.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/client-submissions")
@RequiredArgsConstructor
public class ClientSubmissionController {

    private final ClientSubmissionService submissionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<List<ClientSubmission>>> getSubmissions(
            @RequestParam(required = false) UUID candidateId,
            @RequestParam(required = false) UUID clientId) {

        if (candidateId != null) {
            return ResponseEntity.ok(ApiResponse.success(submissionService.getSubmissionsByCandidate(candidateId)));
        } else if (clientId != null) {
            return ResponseEntity.ok(ApiResponse.success(submissionService.getSubmissionsByClient(clientId)));
        }
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("BAD_REQUEST", "Either candidateId or clientId must be provided"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<ClientSubmission>> createSubmission(
            @RequestBody @Valid CreateSubmissionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                submissionService.createSubmission(
                        request.getCandidateId(),
                        request.getClientId(),
                        request.getJobId(),
                        request.getExternalReferenceId(),
                        request.getRemarks())));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<ClientSubmission>> updateStatus(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                submissionService.updateStatus(id, request.getStatus(), request.getRemarks())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<ClientSubmission>> updateDetails(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateDetailsRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                submissionService.updateDetails(id, request.getExternalReferenceId(), request.getRemarks())));
    }

    @GetMapping("/{id}/comments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<List<ClientSubmissionComment>>> getComments(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.getComments(id)));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<ClientSubmissionComment>> addComment(
            @PathVariable UUID id,
            @RequestBody @Valid AddCommentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.addComment(id, request.getCommentText())));
    }

    @Data
    public static class CreateSubmissionRequest {
        @NotNull
        private UUID candidateId;
        @NotNull
        private UUID clientId;
        private UUID jobId;
        private String externalReferenceId;
        private String remarks;
    }

    @Data
    public static class UpdateStatusRequest {
        @NotNull
        private ClientSubmissionStatus status;
        private String remarks;
    }

    @Data
    public static class UpdateDetailsRequest {
        private String externalReferenceId;
        private String remarks;
    }

    @Data
    public static class AddCommentRequest {
        @NotNull
        private String commentText;
    }
}
