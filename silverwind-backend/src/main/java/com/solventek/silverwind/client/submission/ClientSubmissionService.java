package com.solventek.silverwind.client.submission;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.client.Client;
import com.solventek.silverwind.client.ClientRepository;
import com.solventek.silverwind.jobs.Job;
import com.solventek.silverwind.jobs.JobRepository;
import com.solventek.silverwind.recruitment.Candidate;
import com.solventek.silverwind.recruitment.CandidateRepository;
import com.solventek.silverwind.security.UserPrincipal;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import com.solventek.silverwind.notifications.Notification.NotificationCategory;
import com.solventek.silverwind.notifications.Notification.NotificationPriority;
import com.solventek.silverwind.notifications.NotificationService;
import com.solventek.silverwind.timeline.TimelineService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClientSubmissionService {

    private final ClientSubmissionRepository submissionRepository;
    private final CandidateRepository candidateRepository;
    private final ClientRepository clientRepository;
    private final JobRepository jobRepository;
    private final EmployeeRepository employeeRepository;
    private final ClientSubmissionCommentRepository commentRepository;
    private final NotificationService notificationService;
    private final TimelineService timelineService;

    public List<ClientSubmission> getSubmissionsByCandidate(UUID candidateId) {
        return submissionRepository.findByCandidateId(candidateId);
    }

    public List<ClientSubmission> getSubmissionsByClient(UUID clientId) {
        return submissionRepository.findByClientId(clientId);
    }

    public ClientSubmission getSubmission(UUID id) {
        return submissionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Submission not found: " + id));
    }

    @Transactional
    public ClientSubmission createSubmission(UUID candidateId, UUID clientId, UUID jobId, String externalReferenceId,
            String remarks) {
        log.info("Creating client submission for candidate {} to client {}", candidateId, clientId);

        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new EntityNotFoundException("Candidate not found: " + candidateId));

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new EntityNotFoundException("Client not found: " + clientId));

        Job job = null;
        if (jobId != null) {
            job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new EntityNotFoundException("Job not found: " + jobId));
        }

        Employee submitter = getCurrentUser();

        ClientSubmission submission = ClientSubmission.builder()
                .candidate(candidate)
                .client(client)
                .job(job)
                .externalReferenceId(externalReferenceId)
                .remarks(remarks)
                .submittedBy(submitter)
                .status(ClientSubmissionStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build();

        ClientSubmission savedSubmission = submissionRepository.save(submission);

        if (submitter != null && submitter.getOrganization() != null) {
            UUID orgId = submitter.getOrganization().getId();

            // Timeline
            timelineService.createEvent(orgId, "SUBMISSION", savedSubmission.getId(), "CREATE",
                    "Submission Created", submitter.getId(), "Submitted candidate: " + candidate.getFirstName(),
                    Map.of("candidateId", candidate.getId(), "clientId", client.getId()));

            // Notify Org Admins
            try {
                try {
                    // Notify Org Admins & Solventek Admins
                    List<Employee> recipients = employeeRepository.findByOrganizationIdAndRoleNameNot(
                            orgId, com.solventek.silverwind.rbac.RoleDefinitions.ROLE_EMPLOYEE); // Vendor Admins

                    List<Employee> solventekAdmins = employeeRepository.findByOrganizationTypeAndRoleNameNot(
                            com.solventek.silverwind.org.OrganizationType.SOLVENTEK,
                            com.solventek.silverwind.rbac.RoleDefinitions.ROLE_EMPLOYEE); // Solventek Admins

                    java.util.Set<Employee> allRecipients = new java.util.HashSet<>(recipients);
                    allRecipients.addAll(solventekAdmins);

                    allRecipients.forEach(admin -> {
                        notificationService.sendNotification(
                                NotificationService.NotificationBuilder.create()
                                        .recipient(admin.getId())
                                        .title("New Client Submission")
                                        .body("Candidate " + candidate.getFirstName() + " submitted to "
                                                + client.getName())
                                        .category(NotificationCategory.APPLICATION) // Close enough to Application
                                        .priority(NotificationPriority.NORMAL)
                                        .refEntity("SUBMISSION", savedSubmission.getId())
                                        .actionUrl("/candidates/" + submission.getCandidate().getId()) // Redirect to
                                                                                                       // Candidate

                                        .icon("bi-send"));
                    });
                } catch (Exception e) {
                    log.error("Failed to send submission notification", e);
                }
            } catch (Exception e) {
                log.error("Failed to send submission notification", e);
            }
        }

        return savedSubmission;
    }

    @Transactional
    public ClientSubmission updateStatus(UUID id, ClientSubmissionStatus status, String remarks) {
        log.info("Updating submission {} status to {}", id, status);
        ClientSubmission submission = getSubmission(id);
        ClientSubmissionStatus oldStatus = submission.getStatus();

        submission.setStatus(status);
        if (remarks != null && !remarks.isBlank()) {
            String newRemark = "\n[" + LocalDateTime.now() + "] Status changed to " + status + ": " + remarks;
            submission.setRemarks((submission.getRemarks() != null ? submission.getRemarks() : "") + newRemark);
        }

        ClientSubmission saved = submissionRepository.save(submission);

        Employee currentUser = getCurrentUser();
        UUID userId = currentUser != null ? currentUser.getId() : null;
        // Try to get Org ID from submission submitter if current user is null or
        // system,
        // OR use current user's org. Ideally current user's org.
        UUID orgId = (currentUser != null && currentUser.getOrganization() != null)
                ? currentUser.getOrganization().getId()
                : (submission.getSubmittedBy() != null && submission.getSubmittedBy().getOrganization() != null
                        ? submission.getSubmittedBy().getOrganization().getId()
                        : null);

        if (orgId != null) {
            timelineService.createEvent(orgId, "SUBMISSION", saved.getId(), "STATUS_CHANGE",
                    "Submission Status Updated", userId, "Status changed from " + oldStatus + " to " + status, null);

            // Notify Submitter (Recruiter)
            if (submission.getSubmittedBy() != null) {
                notificationService.sendNotification(
                        NotificationService.NotificationBuilder.create()
                                .recipient(submission.getSubmittedBy().getId())
                                .title("Submission Status Updated")
                                .body("Submission for " + submission.getCandidate().getFirstName() + " is now "
                                        + status)
                                .category(NotificationCategory.APPLICATION)
                                .priority(NotificationPriority.NORMAL)
                                .refEntity("SUBMISSION", saved.getId())
                                .actionUrl("/candidates/" + saved.getCandidate().getId()) // Redirect to Candidate
                                .icon("bi-arrow-repeat"));
            }
        }

        return saved;
    }

    @Transactional
    public ClientSubmission updateDetails(UUID id, String externalReferenceId, String remarks) {
        ClientSubmission submission = getSubmission(id);
        if (externalReferenceId != null)
            submission.setExternalReferenceId(externalReferenceId);
        if (remarks != null)
            submission.setRemarks(remarks);

        ClientSubmission saved = submissionRepository.save(submission);

        Employee currentUser = getCurrentUser();
        UUID userId = currentUser != null ? currentUser.getId() : null;
        UUID orgId = (currentUser != null && currentUser.getOrganization() != null)
                ? currentUser.getOrganization().getId()
                : null;

        if (orgId != null) {
            timelineService.createEvent(orgId, "SUBMISSION", saved.getId(), "UPDATE",
                    "Submission Details Updated", userId, "Details updated", null);
        }
        return saved;
    }

    @Transactional
    public ClientSubmissionComment addComment(UUID submissionId, String commentText) {
        ClientSubmission submission = getSubmission(submissionId);
        Employee author = getCurrentUser();

        ClientSubmissionComment comment = ClientSubmissionComment.builder()
                .clientSubmission(submission)
                .commentText(commentText)
                .author(author)
                .build();

        return commentRepository.save(comment);
    }

    public List<ClientSubmissionComment> getComments(UUID submissionId) {
        return commentRepository.findByClientSubmissionIdOrderByCreatedAtDesc(submissionId);
    }

    private Employee getCurrentUser() {
        if (SecurityContextHolder.getContext().getAuthentication() != null &&
                SecurityContextHolder.getContext().getAuthentication().getPrincipal() instanceof UserPrincipal) {
            UUID userId = ((UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal())
                    .getId();
            return employeeRepository.findById(userId).orElse(null);
        }
        return null;
    }
}
