package com.solventek.silverwind.applications;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ResumeAnalysisRepository extends JpaRepository<ResumeAnalysis, UUID> {
    Optional<ResumeAnalysis> findTopByApplicationIdOrderByAnalyzedAtDesc(UUID applicationId);
}
