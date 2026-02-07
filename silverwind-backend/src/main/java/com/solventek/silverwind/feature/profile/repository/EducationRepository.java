package com.solventek.silverwind.feature.profile.repository;

import com.solventek.silverwind.feature.profile.entity.Education;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface EducationRepository extends JpaRepository<Education, UUID> {
    List<Education> findByEmployeeIdOrderByStartDateDesc(UUID employeeId);
}
