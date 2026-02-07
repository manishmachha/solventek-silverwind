package com.solventek.silverwind.auth;

import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeDto;
import com.solventek.silverwind.auth.EmployeeService;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.org.OrganizationService;
import com.solventek.silverwind.org.OrganizationStatus;
import com.solventek.silverwind.security.JwtTokenProvider;
import com.solventek.silverwind.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.UUID;

/**
 * Authentication controller - public login and vendor registration
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final OrganizationService organizationService;
    private final EmployeeService employeeService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody @Valid LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        // Fetch Organization
        Organization org = null;
        if (userPrincipal.getOrgId() != null) {
            try {
                org = organizationService.getOrganization(userPrincipal.getOrgId());
            } catch (Exception e) {
                // Ignore if org not found
            }
        }

        // Check Org Status for non-SOLVENTEK
        if (!userPrincipal.getOrgType().equals("SOLVENTEK")) {
            if (org != null && org.getStatus() != OrganizationStatus.APPROVED) {
                throw new org.springframework.security.authentication.DisabledException(
                        "Organization not yet approved. Status: " + org.getStatus());
            }
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication, new HashMap<>());

        // Fetch enhanced employee (with presigned URL)
        Employee employee = employeeService.getEmployee(userPrincipal.getId());

        EmployeeDto userDto = EmployeeDto.builder()
                .id(userPrincipal.getId())
                .email(userPrincipal.getEmail())
                .firstName(userPrincipal.getFirstName())
                .lastName(userPrincipal.getLastName())
                .orgId(userPrincipal.getOrgId())
                .orgType(userPrincipal.getOrgType())
                .role(userPrincipal.getRole())
                .organization(org)
                .profilePhotoUrl(employee.getProfilePhotoUrl())
                .build();

        return ResponseEntity.ok(ApiResponse.success(new AuthResponse(token, "refresh-token-placeholder", userDto)));
    }

    @PostMapping("/register-vendor")
    public ResponseEntity<ApiResponse<Organization>> registerVendor(@RequestBody @Valid RegisterVendorRequest request) {
        Organization org = organizationService.registerVendor(request);
        return ResponseEntity.ok(ApiResponse.success("Vendor registration successful. Please check your email/phone for credentials.", org));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<EmployeeDto>> getMe(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        // Fetch Organization
        Organization org = null;
        if (userPrincipal.getOrgId() != null) {
            try {
                org = organizationService.getOrganization(userPrincipal.getOrgId());
            } catch (Exception e) {
                // Ignore
            }
        }

        // Fetch enhanced employee for profile photo
        Employee employee = employeeService.getEmployee(userPrincipal.getId());

        EmployeeDto userDto = EmployeeDto.builder()
                .id(userPrincipal.getId())
                .email(userPrincipal.getEmail())
                .firstName(userPrincipal.getFirstName())
                .lastName(userPrincipal.getLastName())
                .orgId(userPrincipal.getOrgId())
                .orgType(userPrincipal.getOrgType())
                .role(userPrincipal.getRole())
                .organization(org)
                .profilePhotoUrl(employee.getProfilePhotoUrl())
                .build();

        return ResponseEntity.ok(ApiResponse.success(userDto));
    }

    @Data
    public static class LoginRequest {
        @Email
        @NotBlank
        private String email;
        @NotBlank
        private String password;
    }

    @Data
    public static class RegisterVendorRequest {
        // Step 1: Company Information
        @NotBlank
        private String orgName;
        private String legalName;
        private String registrationNumber;
        private String taxId;
        private String website;
        private String industry;
        private String description;

        // Step 2: Contact Information
        @NotBlank
        private String addressLine1;
        private String addressLine2;
        @NotBlank
        private String city;
        @NotBlank
        private String state;
        @NotBlank
        private String country;
        private String postalCode;
        private String companyPhone;

        // Step 3: Primary Contact (Vendor User)
        @NotBlank
        private String firstName;
        @NotBlank
        private String lastName;
        @Email
        @NotBlank
        private String email;
        @NotBlank
        private String password;
        private String phone;
        private String designation;

        // Step 4: Business Details
        private Integer employeeCount;
        private Integer yearsInBusiness;
        private String serviceOfferings;
        private String keyClients;
        private String referralSource;
    }

    @PostMapping("/orgs/{id}/update")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN') or #id.equals(authentication.principal.orgId)")
    public ResponseEntity<ApiResponse<Organization>> updateOrganization(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateOrgRequest request) {
        com.solventek.silverwind.org.OrganizationUpdateDTO dto = new com.solventek.silverwind.org.OrganizationUpdateDTO();
        dto.setName(request.getName());
        return ResponseEntity.ok(ApiResponse.success(
                organizationService.updateOrganization(id, dto)));
    }

    @Data
    public static class UpdateOrgRequest {
        @NotBlank
        private String name;
    }
}
