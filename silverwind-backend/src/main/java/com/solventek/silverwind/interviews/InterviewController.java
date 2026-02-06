package com.solventek.silverwind.interviews;

import com.solventek.silverwind.common.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Interview management controller - Solventek only
 */
@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping("/schedule")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Interview>> scheduleInterview(
            @RequestBody @Valid ScheduleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Interview scheduled successfully.",
                interviewService.scheduleInterview(request.getApplicationId(), request.getInterviewerId(),
                        request.getScheduledAt(), request.getDurationMinutes(), request.getType(),
                        request.getMeetingLink())));
    }

    @PostMapping("/{id}/feedback")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Interview>> submitFeedback(
            @PathVariable UUID id,
            @RequestBody @Valid FeedbackRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Feedback submitted successfully.",
                interviewService.submitFeedback(id, request.getFeedback(), request.getRating(), request.isPassed())));
    }

    @GetMapping("/application/{applicationId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<List<Interview>>> getInterviews(
            @PathVariable UUID applicationId) {
        return ResponseEntity.ok(ApiResponse.success(interviewService.getInterviewsForApplication(applicationId)));
    }

    @Data
    public static class ScheduleRequest {
        @NotNull
        private UUID applicationId;
        @NotNull
        private UUID interviewerId;
        @NotNull
        private LocalDateTime scheduledAt;
        private Integer durationMinutes;
        @NotNull
        private InterviewType type;
        private String meetingLink;
    }

    @Data
    public static class FeedbackRequest {
        private String feedback;
        private Integer rating;
        private boolean passed;
    }
}
