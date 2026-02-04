package com.solventek.silverwind.rbac;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

public interface RoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByNameAndOrganizationId(String name, UUID organizationId);

    List<Role> findByOrganizationId(UUID organizationId);

    Optional<Role> findByNameAndOrganizationIsNull(String name); // Global roles

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Role r WHERE r.organization.id = :orgId OR r.organization IS NULL")
    List<Role> findGlobalOrOrgRoles(@org.springframework.web.bind.annotation.PathVariable("orgId") UUID orgId);
}
