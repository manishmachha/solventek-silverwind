package com.solventek.silverwind.rbac;

import java.util.List;

/**
 * Simplified role definitions for Solventek-dedicated system.
 * SUPER_ADMIN: Solventek organization only
 * HR_ADMIN: HR administrators (Solventek only)
 * TA: Talent Acquisition (Solventek only)
 * EMPLOYEE: Regular employees (Solventek only)
 * VENDOR: Vendor users (1 per vendor organization)
 */
public class RoleDefinitions {

    // Role names - used with @PreAuthorize("hasAnyRole(...)")
    public static final String ROLE_SUPER_ADMIN = "SUPER_ADMIN";
    public static final String ROLE_HR_ADMIN = "HR_ADMIN";
    public static final String ROLE_TA = "TA";
    public static final String ROLE_EMPLOYEE = "EMPLOYEE";
    public static final String ROLE_VENDOR = "VENDOR";

    // All available roles
    public static final List<String> ALL_ROLES = List.of(
            ROLE_SUPER_ADMIN,
            ROLE_HR_ADMIN,
            ROLE_TA,
            ROLE_EMPLOYEE,
            ROLE_VENDOR
    );

    // Solventek-only roles (cannot be assigned to vendors)
    public static final List<String> SOLVENTEK_ROLES = List.of(
            ROLE_SUPER_ADMIN,
            ROLE_HR_ADMIN,
            ROLE_TA,
            ROLE_EMPLOYEE
    );

    public static String getRoleDescription(String roleName) {
        return switch (roleName) {
            case ROLE_SUPER_ADMIN -> "Super Administrator with full access to all Solventek features";
            case ROLE_HR_ADMIN -> "HR Administrator managing employees, payroll, attendance, and leave";
            case ROLE_TA -> "Talent Acquisition specialist managing jobs, applications, and interviews";
            case ROLE_EMPLOYEE -> "Standard Solventek employee with access to personal HR features";
            case ROLE_VENDOR -> "Vendor user managing candidate outsourcing for their organization";
            default -> "Unknown role";
        };
    }
}
