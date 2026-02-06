package com.solventek.silverwind.feature.leave.controller;

import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.feature.leave.dto.LeaveActionDTO;
import com.solventek.silverwind.feature.leave.dto.LeaveBalanceDTO;
import com.solventek.silverwind.feature.leave.dto.LeaveRequestDTO;
import com.solventek.silverwind.feature.leave.dto.LeaveResponseDTO;
import com.solventek.silverwind.feature.leave.dto.LeaveTypeDTO;
import com.solventek.silverwind.feature.leave.entity.LeaveStatus;
import com.solventek.silverwind.feature.leave.service.LeaveOperationService;
import com.solventek.silverwind.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Leave operations controller - Solventek employees only
 */
@RestController
@RequestMapping("/api/v1/leaves")
@RequiredArgsConstructor
public class LeaveOperationController {

    private final LeaveOperationService leaveOperationService;

    @PostMapping("/apply")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<Void>> applyForLeave(@AuthenticationPrincipal UserPrincipal principal,
            @RequestBody LeaveRequestDTO dto) {
        leaveOperationService.submitLeaveRequest(principal.getId(), dto);
        return ResponseEntity.ok(ApiResponse.success("Leave request submitted successfully.", null));
    }

    @GetMapping("/my-requests")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<LeaveResponseDTO>>> getMyRequests(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(leaveOperationService.getMyRequests(principal.getId())));
    }

    @GetMapping("/balances")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<LeaveBalanceDTO>>> getMyBalances(@AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Integer year) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        return ResponseEntity.ok(ApiResponse.success(leaveOperationService.getMyBalances(principal.getId(), targetYear)));
    }

    @GetMapping("/types")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<LeaveTypeDTO>>> getActiveLeaveTypes(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(leaveOperationService.getActiveLeaveTypes(principal.getOrgId())));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<List<LeaveResponseDTO>>> getPendingRequests(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(leaveOperationService.getPendingRequests(principal.getOrgId())));
    }

    @PostMapping("/action")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> takeAction(@AuthenticationPrincipal UserPrincipal admin,
            @RequestBody LeaveActionDTO dto) {
        leaveOperationService.takeAction(admin.getId(), dto);
        return ResponseEntity.ok(ApiResponse.success("Leave action applied successfully.", null));
    }

    @GetMapping("/admin/requests")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Page<LeaveResponseDTO>>> getAllRequests(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LeaveStatus status,
            @RequestParam(required = false) UUID leaveTypeId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @AuthenticationPrincipal UserPrincipal principal,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(leaveOperationService.getAllRequests(search, status, leaveTypeId, startDate, endDate,
                principal.getOrgId(), pageable)));
    }

    @GetMapping("/admin/balances/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<List<LeaveBalanceDTO>>> getUserBalances(
            @PathVariable UUID userId,
            @RequestParam(required = false) Integer year) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        return ResponseEntity.ok(ApiResponse.success(leaveOperationService.getMyBalances(userId, targetYear)));
    }
}
