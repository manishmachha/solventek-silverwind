package com.solventek.silverwind.feature.leave.controller;

import com.solventek.silverwind.security.UserPrincipal;
import com.solventek.silverwind.feature.leave.dto.LeaveActionDTO;
import com.solventek.silverwind.feature.leave.dto.LeaveBalanceDTO;
import com.solventek.silverwind.feature.leave.dto.LeaveRequestDTO;
import com.solventek.silverwind.feature.leave.dto.LeaveResponseDTO;
import com.solventek.silverwind.feature.leave.dto.LeaveTypeDTO;
import com.solventek.silverwind.feature.leave.service.LeaveOperationService;
import com.solventek.silverwind.feature.leave.entity.LeaveStatus;
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
    public ResponseEntity<Void> applyForLeave(@AuthenticationPrincipal UserPrincipal principal,
            @RequestBody LeaveRequestDTO dto) {
        leaveOperationService.submitLeaveRequest(principal.getId(), dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/my-requests")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<List<LeaveResponseDTO>> getMyRequests(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(leaveOperationService.getMyRequests(principal.getId()));
    }

    @GetMapping("/balances")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<List<LeaveBalanceDTO>> getMyBalances(@AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Integer year) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        return ResponseEntity.ok(leaveOperationService.getMyBalances(principal.getId(), targetYear));
    }

    @GetMapping("/types")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<List<LeaveTypeDTO>> getActiveLeaveTypes(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(leaveOperationService.getActiveLeaveTypes(principal.getOrgId()));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<List<LeaveResponseDTO>> getPendingRequests(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(leaveOperationService.getPendingRequests(principal.getOrgId()));
    }

    @PostMapping("/action")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<Void> takeAction(@AuthenticationPrincipal UserPrincipal admin,
            @RequestBody LeaveActionDTO dto) {
        leaveOperationService.takeAction(admin.getId(), dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/admin/requests")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<Page<LeaveResponseDTO>> getAllRequests(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LeaveStatus status,
            @RequestParam(required = false) UUID leaveTypeId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @AuthenticationPrincipal UserPrincipal principal,
            Pageable pageable) {
        return ResponseEntity.ok(leaveOperationService.getAllRequests(search, status, leaveTypeId, startDate, endDate,
                principal.getOrgId(), pageable));
    }

    @GetMapping("/admin/balances/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<List<LeaveBalanceDTO>> getUserBalances(
            @PathVariable UUID userId,
            @RequestParam(required = false) Integer year) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        return ResponseEntity.ok(leaveOperationService.getMyBalances(userId, targetYear));
    }
}
