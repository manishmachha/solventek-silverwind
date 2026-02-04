package com.solventek.silverwind.org;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {

    List<Attendance> findByEmployee_Id(UUID userId);

    List<Attendance> findByEmployee_IdAndDateBetween(UUID userId, LocalDate startDate, LocalDate endDate);

    Optional<Attendance> findByEmployee_IdAndDate(UUID userId, LocalDate date);

    List<Attendance> findByOrganization_IdAndDate(UUID orgId, LocalDate date);

    List<Attendance> findByOrganization_IdAndDateBetween(UUID orgId, LocalDate startDate, LocalDate endDate);
}
