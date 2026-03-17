package com.solventek.silverwind.recruitment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BrandedResumeRepository extends JpaRepository<BrandedResume, UUID> {

    List<BrandedResume> findByCandidateIdOrderByVersionDesc(UUID candidateId);

    Optional<BrandedResume> findTopByCandidateIdOrderByVersionDesc(UUID candidateId);

    Optional<BrandedResume> findByCandidateIdAndVersion(UUID candidateId, int version);

    @Query("SELECT COUNT(b) FROM BrandedResume b WHERE b.candidate.id = :candidateId")
    int countByCandidateId(UUID candidateId);

    @Query("SELECT b FROM BrandedResume b JOIN FETCH b.candidate WHERE b.organization.id = :orgId ORDER BY b.createdAt DESC")
    List<BrandedResume> findByOrganizationIdWithCandidate(UUID orgId);

    @Query("SELECT b FROM BrandedResume b JOIN FETCH b.candidate JOIN FETCH b.organization ORDER BY b.createdAt DESC")
    List<BrandedResume> findAllWithCandidateAndOrg();
}
