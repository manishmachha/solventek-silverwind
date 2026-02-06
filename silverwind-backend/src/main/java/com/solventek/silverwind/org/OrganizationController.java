package com.solventek.silverwind.org;

import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.auth.Employee;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Organization management controller.
 * SUPER_ADMIN manages organizations (primarily vendors).
 */
@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;
    private final com.solventek.silverwind.auth.EmployeeRepository employeeRepository;

    @GetMapping("/vendors/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<Organization>>> getPendingVendors() {
        return ResponseEntity.ok(ApiResponse.success(organizationService.getPendingVendors()));
    }

    @GetMapping("/vendors")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<Organization>>> getAllVendors() {
        return ResponseEntity.ok(ApiResponse.success(organizationService.getAllVendors()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','HR_ADMIN')")
    public ResponseEntity<ApiResponse<List<Organization>>> getAllOrganizations() {
        return ResponseEntity.ok(ApiResponse.success(organizationService.getAllOrganizations()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE','HR_ADMIN','TA', 'VENDOR')")
    public ResponseEntity<ApiResponse<Organization>> getOrganizationById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(organizationService.getOrganization(id)));
    }

    @GetMapping("/{id}/employees")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','HR_ADMIN')")
    public ResponseEntity<ApiResponse<List<Employee>>> getOrganizationEmployees(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(organizationService.getOrganizationEmployees(id)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> approveVendor(@PathVariable UUID id) {
        organizationService.approveVendor(id);
        return ResponseEntity.ok(ApiResponse.success("Vendor approved successfully.", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> rejectVendor(@PathVariable UUID id) {
        organizationService.rejectVendor(id);
        return ResponseEntity.ok(ApiResponse.success("Vendor rejected successfully.", null));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Organization>> updateOrganizationStatus(
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Status updated successfully.",
                organizationService.updateOrganizationStatus(id, request.getStatus())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'VENDOR')")
    public ResponseEntity<ApiResponse<Organization>> updateOrganization(
            @PathVariable UUID id,
            @RequestBody OrganizationUpdateDTO request) {
        
        // Security Check: Vendors can only update their own organization
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_VENDOR"))) {
            String email = auth.getName();
            Employee employee = employeeRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            if (!employee.getOrganization().getId().equals(id)) {
                throw new org.springframework.security.access.AccessDeniedException("You can only update your own organization.");
            }
        }
        return ResponseEntity.ok(ApiResponse.success("Organization updated successfully.", organizationService.updateOrganization(id, request)));
    }

    @PostMapping(value = "/{id}/logo", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'VENDOR')")
    public ResponseEntity<ApiResponse<String>> uploadLogo(
            @PathVariable UUID id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("Logo uploaded successfully.", organizationService.uploadLogo(id, file)));
    }

    @GetMapping("/{id}/logo")
    public ResponseEntity<org.springframework.core.io.Resource> getLogo(@PathVariable UUID id) {
        org.springframework.core.io.Resource resource = organizationService.getLogo(id);
        String contentType = "image/png";
        try {
            contentType = java.nio.file.Files.probeContentType(resource.getFile().toPath());
        } catch (Exception e) {
        }

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
