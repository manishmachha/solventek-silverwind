package com.solventek.silverwind.client.submission;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientSubmissionCommentRepository extends JpaRepository<ClientSubmissionComment, UUID> {
    List<ClientSubmissionComment> findByClientSubmissionIdOrderByCreatedAtDesc(UUID clientSubmissionId);
}
