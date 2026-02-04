package com.solventek.silverwind.org;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, UUID> {

    List<Payroll> findByEmployee_Id(UUID userId);

    List<Payroll> findByEmployee_IdAndYear(UUID userId, int year);

    Optional<Payroll> findByEmployee_IdAndMonthAndYear(UUID userId, int month, int year);

    List<Payroll> findByOrganization_IdAndMonthAndYear(UUID orgId, int month, int year);
}
