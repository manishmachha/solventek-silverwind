package com.solventek.silverwind.client.submission;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientSubmissionRepository extends JpaRepository<ClientSubmission, UUID> {
    List<ClientSubmission> findByCandidateId(UUID candidateId);

    List<ClientSubmission> findByClientId(UUID clientId);

    List<ClientSubmission> findByJobId(UUID jobId);
}
