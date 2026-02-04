package com.solventek.silverwind.org;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    Optional<Organization> findByName(String name);

    java.util.List<Organization> findByType(OrganizationType type);

    java.util.List<Organization> findByTypeAndStatus(OrganizationType type, OrganizationStatus status);

    java.util.List<Organization> findByTypeNotAndStatus(OrganizationType type, OrganizationStatus status);
    java.util.List<Organization> findByStatus(OrganizationStatus status);

}
