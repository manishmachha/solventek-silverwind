package com.solventek.silverwind.feature.leave.controller;

import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.feature.leave.dto.LeaveTypeDTO;
import com.solventek.silverwind.feature.leave.service.LeaveConfigurationService;
import com.solventek.silverwind.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Leave configuration controller - HR Admin only (Solventek)
 */
@RestController
@RequestMapping("/api/v1/admin/leave-types")
@RequiredArgsConstructor
public class LeaveConfigController {

    private final LeaveConfigurationService leaveConfigurationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<List<LeaveTypeDTO>>> getAllLeaveTypes(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(leaveConfigurationService.getAllLeaveTypes(currentUser.getOrgId())));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<LeaveTypeDTO>> createLeaveType(@RequestBody LeaveTypeDTO dto,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Leave type created successfully.", leaveConfigurationService.createLeaveType(dto, currentUser.getOrgId())));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteLeaveType(@PathVariable UUID id) {
        leaveConfigurationService.deleteLeaveType(id);
        return ResponseEntity.ok(ApiResponse.success("Leave type deleted successfully.", null));
    }
}
