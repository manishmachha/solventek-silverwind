package com.solventek.silverwind.applications;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ApplicationDocumentsRepository extends JpaRepository<ApplicationDocuments, UUID> {
    List<ApplicationDocuments> findByApplicationIdOrderByUploadedAtDesc(UUID applicationId);
}
