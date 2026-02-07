package com.solventek.silverwind.feature.profile.repository;

import com.solventek.silverwind.feature.profile.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByEmployeeId(UUID employeeId);
}
