package com.solventek.silverwind.projects;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    @Query("SELECT p.status, COUNT(p) FROM Project p GROUP BY p.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT COALESCE(p.client.name, 'Internal'), COUNT(p) FROM Project p GROUP BY p.client.name")
    List<Object[]> countByClientGrouped();

    List<Project> findByInternalOrgId(UUID internalOrgId);

    @Query("SELECT p.status, COUNT(p) FROM Project p WHERE p.internalOrg.id = :internalOrgId GROUP BY p.status")
    List<Object[]> countByInternalOrgIdGroupedByStatus(UUID internalOrgId);
}
