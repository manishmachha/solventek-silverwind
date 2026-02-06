package com.solventek.silverwind.applications;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {
    Page<JobApplication> findByJobId(UUID jobId, Pageable pageable);

    boolean existsByJobIdAndEmail(UUID jobId, String email);

    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.job j JOIN FETCH j.organization WHERE j.organization.id = :orgId", countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.job.organization.id = :orgId")
    Page<JobApplication> findByJobOrganizationId(UUID orgId, Pageable pageable);

    // Optional: Filter by specific statuses for Client View
    Page<JobApplication> findByJobOrganizationIdAndStatusIn(UUID organizationId,
            List<ApplicationStatus> statuses, Pageable pageable);

    // Visibility for Org: Applications they SENT (Vendor) OR Applications they
    // RECEIVED (Job Owner)
    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.job j JOIN FETCH j.organization LEFT JOIN FETCH a.vendor WHERE a.vendor.id = :vendorId OR j.organization.id = :jobOrganizationId", countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.vendor.id = :vendorId OR a.job.organization.id = :jobOrganizationId")
    Page<JobApplication> findByVendorIdOrJobOrganizationId(UUID vendorId, UUID jobOrganizationId, Pageable pageable);

    @Query(value = "SELECT a FROM JobApplication a JOIN FETCH a.job j JOIN FETCH j.organization LEFT JOIN FETCH a.vendor WHERE a.vendor.id = :vendorId", countQuery = "SELECT COUNT(a) FROM JobApplication a WHERE a.vendor.id = :vendorId")
    Page<JobApplication> findByVendorId(UUID vendorId, Pageable pageable);

    // For async analysis - eagerly fetch Job to prevent LazyInitializationException
    @Query("SELECT a FROM JobApplication a LEFT JOIN FETCH a.job j LEFT JOIN FETCH j.organization WHERE a.id = :id")
    Optional<JobApplication> findByIdWithJob(UUID id);

    long countByJob_Organization_Id(UUID organizationId);

    @Query("SELECT a.status, COUNT(a) FROM JobApplication a JOIN a.job j JOIN j.organization o WHERE o.id = :organizationId GROUP BY a.status")
    List<Object[]> countByJob_Organization_IdGroupedByStatus(UUID organizationId);

    List<JobApplication> findByCandidateId(UUID candidateId);
}
