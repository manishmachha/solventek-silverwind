package com.solventek.silverwind.timeline;

import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.UUID;

/**
 * Timeline and audit log controller
 */
@RestController
@RequestMapping("/api/timeline")
@RequiredArgsConstructor
public class TimelineController {

    private final TimelineService timelineService;

    @GetMapping("/{entityType}/{entityId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR')")
    public ResponseEntity<ApiResponse<Page<TimelineEvent>>> getTimeline(
            @PathVariable String entityType,
            @PathVariable UUID entityId,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(timelineService.getTimeline(entityType, entityId, pageable)));
    }

    // ===== AUDIT LOG ENDPOINTS =====

    @GetMapping("/audit-logs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<TimelineEvent>>> getAllAuditLogs(
            @AuthenticationPrincipal UserPrincipal principal,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(timelineService.getAllAuditLogs(principal, pageable)));
    }

    @GetMapping("/audit-logs/entity/{entityType}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<TimelineEvent>>> getAuditLogsByEntityType(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String entityType,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(timelineService.getAuditLogsByEntityType(principal, entityType, pageable)));
    }

    @GetMapping("/audit-logs/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<TimelineEvent>>> searchAuditLogs(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String action,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(timelineService.searchAuditLogsByAction(principal, action, pageable)));
    }

    @GetMapping("/audit-logs/date-range")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Page<TimelineEvent>>> getAuditLogsByDateRange(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(timelineService.getAuditLogsByDateRange(principal, startDate, endDate, pageable)));
    }
}
