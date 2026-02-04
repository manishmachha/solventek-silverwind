package com.solventek.silverwind.org;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, UUID> {

    Optional<SalaryStructure> findByEmployee_Id(UUID userId);

    List<SalaryStructure> findByOrganization_Id(UUID orgId);

    boolean existsByEmployee_Id(UUID userId);
}
