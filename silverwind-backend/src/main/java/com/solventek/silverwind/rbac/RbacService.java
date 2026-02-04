package com.solventek.silverwind.rbac;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.org.OrganizationRepository;
import com.solventek.silverwind.org.OrganizationType;
import com.solventek.silverwind.timeline.TimelineService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Simplified RBAC Service - No role CRUD, roles are fixed and auto-created.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RbacService {

    private final RoleRepository roleRepository;
    private final EmployeeRepository employeeRepository;
    private final OrganizationRepository organizationRepository;
    private final TimelineService timelineService;

    /**
     * Get all roles for an organization.
     */
    public List<Role> getRoles(UUID orgId) {
        log.debug("Fetching roles for Org ID: {}", orgId);
        return roleRepository.findByOrganizationId(orgId);
    }

    /**
     * Initialize fixed roles for an organization.
     * Solventek: SUPER_ADMIN, HR_ADMIN, TA, EMPLOYEE
     * Vendor: VENDOR only
     */
    @Transactional
    public void initializeOrgRoles(UUID orgId) {
        log.info("Initializing roles for Organization ID: {}", orgId);
        try {
            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new EntityNotFoundException("Organization not found: " + orgId));

            if (org.getType() == OrganizationType.SOLVENTEK) {
                // Solventek gets all employee roles
                createRoleIfNotExists(org, RoleDefinitions.ROLE_SUPER_ADMIN);
                createRoleIfNotExists(org, RoleDefinitions.ROLE_HR_ADMIN);
                createRoleIfNotExists(org, RoleDefinitions.ROLE_TA);
                createRoleIfNotExists(org, RoleDefinitions.ROLE_EMPLOYEE);
            } else if (org.getType() == OrganizationType.VENDOR) {
                // Vendors get only VENDOR role
                createRoleIfNotExists(org, RoleDefinitions.ROLE_VENDOR);
            }
            
            log.info("Roles initialized for Org {}", orgId);
        } catch (Exception e) {
            log.error("Error initializing roles for Org {}: {}", orgId, e.getMessage(), e);
            throw e;
        }
    }

    private void createRoleIfNotExists(Organization org, String roleName) {
        if (roleRepository.findByNameAndOrganizationId(roleName, org.getId()).isEmpty()) {
            Role role = Role.builder()
                    .name(roleName)
                    .description(RoleDefinitions.getRoleDescription(roleName))
                    .organization(org)
                    .build();
            roleRepository.save(role);
            log.info("Created role: {} for Org: {}", roleName, org.getId());
        }
    }

    /**
     * Assign a role to a user (for Solventek admins managing their employees).
     */
    @Transactional
    public void assignRoleToUser(UUID targetUserId, UUID roleId, UUID actorOrgId) {
        log.info("Assigning Role ID: {} to User ID: {}", roleId, targetUserId);
        try {
            Employee employee = employeeRepository.findById(targetUserId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found: " + targetUserId));

            // Only Solventek can manage roles
            Organization actorOrg = organizationRepository.findById(actorOrgId)
                    .orElseThrow(() -> new EntityNotFoundException("Organization not found"));
            
            if (actorOrg.getType() != OrganizationType.SOLVENTEK) {
                throw new IllegalArgumentException("Only Solventek can manage user roles");
            }

            if (!employee.getOrganization().getId().equals(actorOrgId)) {
                throw new IllegalArgumentException("Cannot manage users from another organization");
            }

            Role role = roleRepository.findById(roleId)
                    .orElseThrow(() -> new EntityNotFoundException("Role not found: " + roleId));

            if (role.getOrganization() != null && !role.getOrganization().getId().equals(actorOrgId)) {
                throw new IllegalArgumentException("Cannot assign role from another organization");
            }

            employee.setRole(role);
            employeeRepository.save(employee);

            timelineService.createEvent(actorOrgId, "USER", targetUserId, "UPDATE_ROLE", 
                "User Role Updated", null, "Role changed to " + role.getName(), null);
            log.info("Role assigned to user: {}", targetUserId);
        } catch (Exception e) {
            log.error("Error assigning role: {}", e.getMessage(), e);
            throw e;
        }
    }
}
