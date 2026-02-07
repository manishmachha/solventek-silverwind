package com.solventek.silverwind.feature.profile.repository;

import com.solventek.silverwind.feature.profile.entity.Certification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CertificationRepository extends JpaRepository<Certification, UUID> {
    List<Certification> findByEmployeeIdOrderByIssueDateDesc(UUID employeeId);
}
