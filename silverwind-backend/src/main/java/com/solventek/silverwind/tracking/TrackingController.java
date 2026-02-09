package com.solventek.silverwind.tracking;

import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.tracking.dto.CandidateDashboardDTO;
import com.solventek.silverwind.tracking.dto.TrackingLoginRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import lombok.Data;
import java.util.UUID;

@RestController
@RequestMapping("/api/tracking")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingService trackingService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<CandidateDashboardDTO>> login(@RequestBody TrackingLoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(trackingService.login(request.getApplicationId(), request.getDateOfBirth())));
    }

    @GetMapping("/dashboard/{token}")
    public ResponseEntity<ApiResponse<CandidateDashboardDTO>> getDashboard(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.success(trackingService.getDashboard(token)));
    }

    @PostMapping("/{applicationId}/comment")
    public ResponseEntity<ApiResponse<Void>> addComment(
            @PathVariable UUID applicationId,
            @RequestBody CommentRequest request) {
        trackingService.addComment(applicationId, request.getComment());
        return ResponseEntity.ok(ApiResponse.success("Comment added successfully", null));
    }

    @PostMapping(value = "/{applicationId}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Void>> uploadDocument(
            @PathVariable UUID applicationId,
            @RequestParam("category") String category,
            @RequestParam("file") MultipartFile file) {
        if (file.getSize() > 1024 * 1024) {
            throw new org.springframework.web.multipart.MaxUploadSizeExceededException(1024 * 1024);
        }
        trackingService.uploadDocument(applicationId, category, file);
        return ResponseEntity.ok(ApiResponse.success("Document uploaded successfully", null));
    }

    @Data
    public static class CommentRequest {
        private String comment;
    }
}
