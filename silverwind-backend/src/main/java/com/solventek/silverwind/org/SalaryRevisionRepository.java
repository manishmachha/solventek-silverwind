package com.solventek.silverwind.org;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SalaryRevisionRepository extends JpaRepository<SalaryRevision, UUID> {

    List<SalaryRevision> findByEmployee_IdOrderByRevisionDateDesc(UUID userId);
}
