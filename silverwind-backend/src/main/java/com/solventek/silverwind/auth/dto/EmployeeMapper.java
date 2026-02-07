package com.solventek.silverwind.auth.dto;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.embeddable.BankDetails;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.rbac.Role;
import org.springframework.stereotype.Component;

/**
 * Mapper utility for converting Employee entities to DTOs
 */
@Component
public class EmployeeMapper {

    public EmployeeResponse toEmployeeResponse(Employee employee) {
        if (employee == null) return null;

        return EmployeeResponse.builder()
                .id(employee.getId())
                .email(employee.getEmail())
                .firstName(employee.getFirstName())
                .lastName(employee.getLastName())
                .phone(employee.getPhone())
                .dateOfBirth(employee.getDateOfBirth())
                .gender(employee.getGender() != null ? employee.getGender().name() : null)
                .profilePhotoUrl(employee.getProfilePhotoUrl())
                .employeeCode(employee.getEmployeeCode())
                .username(employee.getUsername())
                .dateOfJoining(employee.getDateOfJoining())
                .dateOfExit(employee.getDateOfExit())
                .employmentStatus(employee.getEmploymentStatus() != null ? employee.getEmploymentStatus().name() : null)
                .department(employee.getDepartment())
                .designation(employee.getDesignation())
                .employmentType(employee.getEmploymentType() != null ? employee.getEmploymentType().name() : null)
                .workLocation(employee.getWorkLocation())
                .gradeLevel(employee.getGradeLevel())
                .enabled(employee.getEnabled())
                .accountLocked(employee.getAccountLocked())
                .lastLoginAt(employee.getLastLoginAt())
                .passwordUpdatedAt(employee.getPasswordUpdatedAt())
                .address(employee.getAddress())
                .emergencyContact(employee.getEmergencyContact())
                .bankDetails(toBankDetailsDto(employee.getBankDetails()))
                .taxIdPan(employee.getTaxIdPan())
                .manager(toManagerSummary(employee.getManager()))
                .managerId(employee.getManager() != null ? employee.getManager().getId() : null)
                .role(toRoleDto(employee.getRole()))
                .organization(toOrganizationDto(employee.getOrganization()))
                .orgId(employee.getOrganization() != null ? employee.getOrganization().getId() : null)
                .orgType(employee.getOrganization() != null ? employee.getOrganization().getType().name() : null)
                .createdAt(employee.getCreatedAt())
                .updatedAt(employee.getUpdatedAt())
                .build();
    }

    public ManagerSummary toManagerSummary(Employee manager) {
        if (manager == null) return null;

        return ManagerSummary.builder()
                .id(manager.getId())
                .firstName(manager.getFirstName())
                .lastName(manager.getLastName())
                .email(manager.getEmail())
                .profilePhotoUrl(manager.getProfilePhotoUrl())
                .build();
    }

    public RoleDto toRoleDto(Role role) {
        if (role == null) return null;

        return RoleDto.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .build();
    }

    public OrganizationDto toOrganizationDto(Organization org) {
        if (org == null) return null;

        return OrganizationDto.builder()
                .id(org.getId())
                .name(org.getName())
                .legalName(org.getLegalName())
                .type(org.getType() != null ? org.getType().name() : null)
                .status(org.getStatus() != null ? org.getStatus().name() : null)
                .logoUrl(org.getLogoUrl())
                .email(org.getEmail())
                .phone(org.getPhone())
                .website(org.getWebsite())
                .industry(org.getIndustry())
                .description(org.getDescription())
                .employeeCount(org.getEmployeeCount())
                .yearsInBusiness(org.getYearsInBusiness())
                .addressLine1(org.getAddressLine1())
                .addressLine2(org.getAddressLine2())
                .city(org.getCity())
                .state(org.getState())
                .country(org.getCountry())
                .postalCode(org.getPostalCode())
                .contactPersonName(org.getContactPersonName())
                .contactPersonDesignation(org.getContactPersonDesignation())
                .contactPersonEmail(org.getContactPersonEmail())
                .contactPersonPhone(org.getContactPersonPhone())
                .serviceOfferings(org.getServiceOfferings())
                .keyClients(org.getKeyClients())
                .referralSource(org.getReferralSource())
                .build();
    }

    public BankDetailsDto toBankDetailsDto(BankDetails bankDetails) {
        if (bankDetails == null) return null;

        String maskedAccountNumber = null;
        if (bankDetails.getAccountNumber() != null && bankDetails.getAccountNumber().length() >= 4) {
            maskedAccountNumber = "****" + bankDetails.getAccountNumber().substring(bankDetails.getAccountNumber().length() - 4);
        } else if (bankDetails.getAccountNumber() != null) {
            maskedAccountNumber = "****";
        }

        return BankDetailsDto.builder()
                .bankName(bankDetails.getBankName())
                .accountNumberMasked(maskedAccountNumber)
                .ifscCode(bankDetails.getIfscCode())
                .branchName(bankDetails.getBranchName())
                .build();
    }
}
