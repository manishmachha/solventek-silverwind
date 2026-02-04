package com.solventek.silverwind.org;

import com.solventek.silverwind.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Vendor management controller for Solventek admins.
 * SUPER_ADMIN can approve/reject vendors.
 */
@RestController
@RequestMapping("/api/admin/vendors")
@RequiredArgsConstructor
public class AdminVendorController {

    private final OrganizationService organizationService;

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> approveVendor(@PathVariable UUID id) {
        organizationService.approveVendor(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> rejectVendor(@PathVariable UUID id) {
        organizationService.rejectVendor(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<Organization>>> listVendors(
            @RequestParam(required = false) OrganizationStatus status) {
        if (status == OrganizationStatus.PENDING_VERIFICATION) {
            return ResponseEntity.ok(ApiResponse.success(organizationService.getPendingVendors()));
        }
        return ResponseEntity.ok(ApiResponse.success(organizationService.getAllVendors()));
    }
}
