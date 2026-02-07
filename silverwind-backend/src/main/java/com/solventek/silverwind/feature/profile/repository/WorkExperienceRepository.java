package com.solventek.silverwind.feature.profile.repository;

import com.solventek.silverwind.feature.profile.entity.WorkExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface WorkExperienceRepository extends JpaRepository<WorkExperience, UUID> {
    List<WorkExperience> findByEmployeeIdOrderByStartDateDesc(UUID employeeId);
}
