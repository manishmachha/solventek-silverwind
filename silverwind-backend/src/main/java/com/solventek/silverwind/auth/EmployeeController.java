package com.solventek.silverwind.auth;

import com.solventek.silverwind.auth.dto.EmployeeMapper;
import com.solventek.silverwind.auth.dto.EmployeeResponse;
import com.solventek.silverwind.auth.embeddable.Address;
import com.solventek.silverwind.auth.embeddable.BankDetails;
import com.solventek.silverwind.auth.embeddable.EmergencyContact;
import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.enums.*;
import com.solventek.silverwind.security.UserPrincipal;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Employee management controller - Solventek HR portal
 * Restricted to SOLVENTEK organization only
 */
@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final EmployeeMapper employeeMapper;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody @jakarta.validation.Valid CreateEmployeeRequest request) {

        Employee created = employeeService.createEmployee(currentUser.getOrgId(), request.firstName, request.lastName, request.email,
                request.phone, request.dateOfBirth, request.gender, request.profilePhotoUrl,
                request.employeeCode, request.dateOfJoining, request.employmentStatus, request.department,
                request.designation, request.employmentType, request.workLocation, request.gradeLevel,
                request.address, request.emergencyContact, request.bankDetails,
                request.roleId);
        return ResponseEntity.ok(ApiResponse.success("Employee created successfully.", employeeMapper.toEmployeeResponse(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN') or #id.equals(authentication.principal.id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody @jakarta.validation.Valid CreateEmployeeRequest request) {

        Employee updated = employeeService.updateEmployee(id, currentUser.getOrgId(), request.firstName, request.lastName,
                request.phone, request.dateOfBirth, request.gender, request.profilePhotoUrl,
                request.employeeCode, request.dateOfJoining, request.employmentStatus, request.department,
                request.designation, request.employmentType, request.workLocation, request.gradeLevel,
                request.address, request.emergencyContact, request.bankDetails,
                request.roleId);
        return ResponseEntity.ok(ApiResponse.success("Employee updated successfully.", employeeMapper.toEmployeeResponse(updated)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE') or #id.equals(authentication.principal.id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployee(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(employeeMapper.toEmployeeResponse(employeeService.getEmployee(id))));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Page<EmployeeResponse>>> getEmployees(
            @AuthenticationPrincipal UserPrincipal currentUser,
            Pageable pageable) {
        Page<EmployeeResponse> page = employeeService.getEmployees(currentUser.getOrgId(), pageable)
                .map(employeeMapper::toEmployeeResponse);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PostMapping("/{id}/personal")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN') or #id.equals(authentication.principal.id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updatePersonal(
            @PathVariable UUID id,
            @RequestBody PersonalDetailsRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Employee updated = employeeService.updatePersonalDetails(id, currentUser.getId(), request.firstName, request.lastName,
                request.dateOfBirth, request.gender, request.profilePhotoUrl);
        return ResponseEntity.ok(ApiResponse.success("Personal details updated successfully.", employeeMapper.toEmployeeResponse(updated)));
    }

    @PostMapping("/{id}/employment")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployment(
            @PathVariable UUID id,
            @RequestBody EmploymentDetailsRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Employee updated = employeeService.updateEmploymentDetails(id, currentUser.getId(), request.employeeCode,
                request.dateOfJoining,
                request.employmentStatus, request.department, request.designation,
                request.employmentType, request.workLocation, request.gradeLevel);
        return ResponseEntity.ok(ApiResponse.success("Employment details updated successfully.", employeeMapper.toEmployeeResponse(updated)));
    }

    @PostMapping("/{id}/contact")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN') or #id.equals(authentication.principal.id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateContact(
            @PathVariable UUID id,
            @RequestBody ContactInfoRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Employee updated = employeeService.updateContactInfo(id, currentUser.getId(), request.phone, request.address,
                request.emergencyContact);
        return ResponseEntity.ok(ApiResponse.success("Contact info updated successfully.", employeeMapper.toEmployeeResponse(updated)));
    }

    @PostMapping("/{id}/bank")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN') or #id.equals(authentication.principal.id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateBank(
            @PathVariable UUID id,
            @RequestBody BankDetailsRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Employee updated = employeeService.updateBankDetails(id, currentUser.getId(), request.bankDetails, request.taxIdPan);
        return ResponseEntity.ok(ApiResponse.success("Bank details updated successfully.", employeeMapper.toEmployeeResponse(updated)));
    }

    @PostMapping("/{id}/manager")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateManager(
            @PathVariable UUID id,
            @RequestBody UpdateManagerRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Employee updated = employeeService.updateManager(id, request.managerId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Manager updated successfully.", employeeMapper.toEmployeeResponse(updated)));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Employee updated = employeeService.updateAccountStatus(id, currentUser.getId(), request.enabled, request.accountLocked);
        return ResponseEntity.ok(ApiResponse.success("Account status updated successfully.", employeeMapper.toEmployeeResponse(updated)));
    }

    @PostMapping("/{id}/employment-status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmploymentStatus(
            @PathVariable UUID id,
            @RequestBody EmploymentStatusRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Employee updated = employeeService.updateEmploymentStatus(id, currentUser.getId(), request.employmentStatus);
        return ResponseEntity.ok(ApiResponse.success("Employment status updated successfully.", employeeMapper.toEmployeeResponse(updated)));
    }

    @Data
    public static class CreateEmployeeRequest {
        @jakarta.validation.constraints.NotBlank
        String firstName;
        @jakarta.validation.constraints.NotBlank
        String lastName;
        @jakarta.validation.constraints.Email
        @jakarta.validation.constraints.NotBlank
        String email;

        UUID roleId;

        String phone;
        LocalDate dateOfBirth;
        Gender gender;
        String profilePhotoUrl;

        String employeeCode;
        String username;
        LocalDate dateOfJoining;
        EmploymentStatus employmentStatus;
        String department;
        String designation;
        EmploymentType employmentType;
        String workLocation;
        String gradeLevel;

        Address address;
        EmergencyContact emergencyContact;
        BankDetails bankDetails;
        String taxIdPan;
    }

    @Data
    public static class PersonalDetailsRequest {
        String firstName;
        String lastName;
        LocalDate dateOfBirth;
        Gender gender;
        String profilePhotoUrl;
    }

    @Data
    public static class EmploymentDetailsRequest {
        String employeeCode;
        LocalDate dateOfJoining;
        EmploymentStatus employmentStatus;
        String department;
        String designation;
        EmploymentType employmentType;
        String workLocation;
        String gradeLevel;
    }

    @Data
    public static class ContactInfoRequest {
        String phone;
        Address address;
        EmergencyContact emergencyContact;
    }

    @Data
    public static class BankDetailsRequest {
        BankDetails bankDetails;
        String taxIdPan;
    }

    @Data
    public static class UpdateManagerRequest {
        UUID managerId;
    }

    @Data
    public static class UpdateStatusRequest {
        Boolean enabled;
        Boolean accountLocked;
    }

    @Data
    public static class EmploymentStatusRequest {
        @jakarta.validation.constraints.NotNull
        EmploymentStatus employmentStatus;
    }

    @PostMapping("/{id}/convert-to-fte")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> convertToFullTime(
            @PathVariable UUID id,
            @RequestBody(required = false) ConvertToFteRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        LocalDate conversionDate = request != null ? request.conversionDate : null;
        Employee updated = employeeService.convertToFullTime(id, currentUser.getId(), conversionDate);
        return ResponseEntity.ok(ApiResponse.success("Converted to FTE successfully.", employeeMapper.toEmployeeResponse(updated)));
    }

    @Data
    public static class ConvertToFteRequest {
        LocalDate conversionDate;
    }

    @PostMapping("/{id}/password")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> changePassword(
            @PathVariable UUID id,
            @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Employee updated = employeeService.changePassword(id, currentUser.getId(), request.newPassword);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully.", employeeMapper.toEmployeeResponse(updated)));
    }

    @Data
    public static class ChangePasswordRequest {
        @jakarta.validation.constraints.NotBlank
        @jakarta.validation.constraints.Size(min = 8, max = 100)
        String newPassword;
    }

    @PostMapping("/{id}/photo")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE') or #id.equals(authentication.principal.id)")
    public ResponseEntity<ApiResponse<EmployeeResponse>> uploadPhoto(
            @PathVariable UUID id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Employee updated = employeeService.uploadProfilePhoto(id, currentUser.getId(), file);
        return ResponseEntity.ok(ApiResponse.success("Photo uploaded successfully.", employeeMapper.toEmployeeResponse(updated)));
    }

    @GetMapping("/{id}/photo")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE') or #id.equals(authentication.principal.id)")
    public ResponseEntity<org.springframework.core.io.Resource> getPhoto(@PathVariable UUID id) {
        try {
            org.springframework.core.io.Resource resource = employeeService.getProfilePhoto(id);
            String contentType = "image/jpeg";
            try {
                if (resource.isFile()) {
                    contentType = java.nio.file.Files.probeContentType(resource.getFile().toPath());
                }
            } catch (Exception e) {
                // Default to image/jpeg if detection fails
            }

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
