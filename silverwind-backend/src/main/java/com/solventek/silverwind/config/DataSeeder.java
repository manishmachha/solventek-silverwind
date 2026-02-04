package com.solventek.silverwind.config;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.org.OrganizationRepository;
import com.solventek.silverwind.org.OrganizationType;
import com.solventek.silverwind.rbac.Role;
import com.solventek.silverwind.rbac.RoleDefinitions;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final OrganizationRepository organizationRepository;
    private final com.solventek.silverwind.rbac.RoleRepository roleRepository;
    private final com.solventek.silverwind.auth.EmployeeRepository employeeRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final com.solventek.silverwind.rbac.RbacService rbacService;

    @Override
    @Transactional
    public void run(String... args) {
        seedSolventekOrg();
        seedSuperAdmin();
    }

    private void seedSolventekOrg() {
        if (organizationRepository.findByType(OrganizationType.SOLVENTEK).isEmpty()) {
            Organization org = Organization.builder()
                    .name("Solventek")
                    .type(OrganizationType.SOLVENTEK)
                    .status(com.solventek.silverwind.org.OrganizationStatus.APPROVED)
                    .email("admin@solventek.com")
                    .phone("1234567890")
                    .addressLine1("123 Tech Park")
                    .city("Tech City")
                    .country("India")
                    .contactPersonName("Super Admin")
                    .contactPersonEmail("admin@solventek.com")
                    .build();
            organizationRepository.save(org);
            
            // Initialize roles for Solventek
            rbacService.initializeOrgRoles(org.getId());
            System.out.println("Seeded Solventek Organization with roles.");
        } else {
            System.out.println("Solventek Organization already exists.");
        }
    }

    private void seedSuperAdmin() {
        // 1. Find the Solventek Organization
        List<Organization> solventekOrgs = organizationRepository.findByType(OrganizationType.SOLVENTEK);
        Organization solventekOrg = solventekOrgs.stream().findFirst().orElse(null);

        if (solventekOrg == null) {
            System.out.println("SKIPPING SUPER ADMIN SEEDING: No Organization with type SOLVENTEK found.");
            return;
        }

        // 2. Find the Super Admin Role
        Role superAdminRole = roleRepository.findByNameAndOrganizationId(
                RoleDefinitions.ROLE_SUPER_ADMIN, solventekOrg.getId())
                .orElse(null);

        if (superAdminRole == null) {
            System.out.println("SKIPPING SUPER ADMIN SEEDING: Role SUPER_ADMIN not found for Solventek.");
            return;
        }

        // 3. Check if User exists
        String email = "superadmin@solventek.com";
        if (employeeRepository.findByEmail(email).isPresent()) {
            System.out.println("Super Admin user already exists.");
            return;
        }

        // 4. Create User
        Employee superAdmin = Employee.builder()
                .email(email)
                .username("admin")
                .passwordHash(passwordEncoder.encode("password"))
                .firstName("Super")
                .lastName("Admin")
                .organization(solventekOrg)
                .role(superAdminRole)
                .enabled(true)
                .accountLocked(false)
                .failedLoginAttempts(0)
                .createdBy("SYSTEM_SEEDER")
                .updatedBy("SYSTEM_SEEDER")
                .build();

        employeeRepository.save(superAdmin);
        System.out.println("Seeded Super Admin: " + email);
    }
}
