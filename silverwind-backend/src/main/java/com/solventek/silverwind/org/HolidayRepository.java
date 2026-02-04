package com.solventek.silverwind.org;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, UUID> {

    List<Holiday> findAllByOrganizationId(UUID organizationId);

    Optional<Holiday> findByOrganizationIdAndDate(UUID organizationId, LocalDate date);

    Optional<Holiday> findByOrganizationIdAndNameIgnoreCase(UUID organizationId, String name);
}
