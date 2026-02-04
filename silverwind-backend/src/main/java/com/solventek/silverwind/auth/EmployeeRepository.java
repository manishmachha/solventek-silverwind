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

    boolean existsByRoleId(UUID roleId);

    boolean existsByEmail(String email);
}
