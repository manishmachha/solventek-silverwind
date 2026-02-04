package com.solventek.silverwind.feature.leave.repository;

import com.solventek.silverwind.feature.leave.entity.LeaveRequest;
import com.solventek.silverwind.feature.leave.entity.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface LeaveRequestRepository
        extends JpaRepository<LeaveRequest, UUID>, JpaSpecificationExecutor<LeaveRequest> {
    List<LeaveRequest> findByEmployeeIdOrderByCreatedAtDesc(UUID userId);

    List<LeaveRequest> findByStatusOrderByCreatedAtDesc(LeaveStatus status);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.status = 'PENDING' AND lr.organizationId = :organizationId ORDER BY lr.createdAt ASC")
    List<LeaveRequest> findAllPendingByOrganizationId(UUID organizationId);

    List<LeaveRequest> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    long countByOrganizationIdAndStatus(UUID organizationId, LeaveStatus status);
}
