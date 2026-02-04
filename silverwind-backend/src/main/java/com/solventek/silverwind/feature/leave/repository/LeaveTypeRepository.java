package com.solventek.silverwind.feature.leave.repository;

import com.solventek.silverwind.feature.leave.entity.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface LeaveTypeRepository extends JpaRepository<LeaveType, UUID> {
    boolean existsByNameAndOrganizationId(String name, UUID organizationId);

    java.util.List<LeaveType> findAllByOrganizationId(UUID organizationId);

    // For Backfill
    java.util.List<LeaveType> findAll();
}
