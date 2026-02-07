package com.solventek.silverwind.feature.profile.repository;

import com.solventek.silverwind.feature.profile.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SkillRepository extends JpaRepository<Skill, UUID> {
    List<Skill> findByEmployeeId(UUID employeeId);
}
