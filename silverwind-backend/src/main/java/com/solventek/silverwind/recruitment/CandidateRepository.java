package com.solventek.silverwind.recruitment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, UUID> {
    List<Candidate> findByOrganizationId(UUID organizationId);

    Optional<Candidate> findByEmail(String email);

    Optional<Candidate> findByEmailAndOrganizationId(String email, UUID organizationId);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Candidate c LEFT JOIN FETCH c.skills JOIN FETCH c.organization WHERE c.id = :id")
    Optional<Candidate> findByIdWithDetails(@org.springframework.data.repository.query.Param("id") UUID id);
}
