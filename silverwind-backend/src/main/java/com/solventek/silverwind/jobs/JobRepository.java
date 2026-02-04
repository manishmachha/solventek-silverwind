package com.solventek.silverwind.jobs;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, UUID> {
    Page<Job> findByOrganizationId(UUID organizationId, Pageable pageable);

    Page<Job> findByStatusIn(List<JobStatus> statuses, Pageable pageable);

    List<Job> findByOrganizationIdAndStatus(UUID organizationId, JobStatus status);

    long countByOrganizationIdAndStatus(UUID organizationId, JobStatus status);
}
