package com.solventek.silverwind.projects;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ProjectAllocationRepository extends JpaRepository<ProjectAllocation, UUID> {
    List<ProjectAllocation> findByProjectId(UUID projectId);

    List<ProjectAllocation> findByEmployeeId(UUID userId);
}
