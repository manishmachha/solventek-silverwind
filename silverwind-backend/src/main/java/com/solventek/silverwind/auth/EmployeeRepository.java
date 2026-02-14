package com.solventek.silverwind.auth;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    @Query("SELECT e.department, COUNT(e) FROM Employee e WHERE e.organization.id = :organizationId GROUP BY e.department")
    java.util.List<Object[]> countByOrganizationIdGroupedByDepartment(UUID organizationId);

    @Query("SELECT e.employmentStatus, COUNT(e) FROM Employee e WHERE e.organization.id = :organizationId GROUP BY e.employmentStatus")
    java.util.List<Object[]> countByOrganizationIdGroupedByStatus(UUID organizationId);

    long countByOrganizationId(UUID organizationId);

    @EntityGraph(attributePaths = { "organization", "role" })
    Optional<Employee> findByEmail(String email);

    java.util.List<Employee> findByOrganizationId(UUID organizationId);

    org.springframework.data.domain.Page<Employee> findByOrganizationId(UUID organizationId,
            org.springframework.data.domain.Pageable pageable);

    java.util.List<Employee> findByManagerId(UUID managerId);

    // Find all users in an org except those with strict EMPLOYEE role (i.e. find
    // Admins, Managers, Vendors)
    java.util.List<Employee> findByOrganizationIdAndRoleNameNot(UUID organizationId, String roleName);

    // Find all users in organizations of a specific type (e.g. SOLVENTEK) except
    // those with strict EMPLOYEE role
    java.util.List<Employee> findByOrganizationTypeAndRoleNameNot(com.solventek.silverwind.org.OrganizationType type,
            String roleName);

    boolean existsByRoleId(UUID roleId);

    boolean existsByEmail(String email);
}
