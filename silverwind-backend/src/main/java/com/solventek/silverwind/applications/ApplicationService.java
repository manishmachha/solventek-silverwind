package com.solventek.silverwind.applications;

import com.solventek.silverwind.applications.ApplicationController.ApplyRequest;
import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.jobs.Job;
import com.solventek.silverwind.jobs.JobRepository;
import com.solventek.silverwind.notifications.Notification.NotificationCategory;
import com.solventek.silverwind.notifications.Notification.NotificationPriority;
import com.solventek.silverwind.notifications.NotificationService;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.org.OrganizationRepository;
import com.solventek.silverwind.org.OrganizationService;
import com.solventek.silverwind.recruitment.Candidate;
import com.solventek.silverwind.recruitment.CandidateRepository;
import com.solventek.silverwind.timeline.TimelineEvent;
import com.solventek.silverwind.timeline.TimelineService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationService {

        private final JobApplicationRepository applicationRepository;
        private final JobRepository jobRepository;
        private final OrganizationRepository organizationRepository;
        private final OrganizationService organizationService;
        private final TimelineService timelineService;
        private final EmployeeRepository employeeRepository;
        private final NotificationService notificationService;

        // AI & Documents Dependencies
        private final ResumeIngestionService ingestionService;
        private final ResumeAnalysisOrchestratorService analysisOrchestrator;
        private final ApplicationDocumentsRepository documentsRepository;
        private final ResumeAnalysisRepository analysisRepository;
        private final CandidateRepository candidateRepository;

        @Transactional
        public JobApplication apply(UUID jobId,
                        ApplyRequest request,
                        MultipartFile resumeFile,
                        UUID vendorOrgId) {
                log.info("Processing job application for Job ID: {} from: {}", jobId, request.getEmail());
                try {
                        Job job = jobRepository.findById(jobId)
                                        .orElseThrow(() -> new EntityNotFoundException(
                                                        "Job not found with ID: " + jobId));
                        Organization vendor = null;
                        if (vendorOrgId != null) {
                            vendor = organizationRepository.findById(vendorOrgId)
                                            .orElseThrow(() -> new EntityNotFoundException(
                                                            "Vendor organization not found: " + vendorOrgId));
                        }

                        if (applicationRepository.existsByJobIdAndEmail(jobId, request.getEmail())) {
                                log.warn("Application already exists for Email: {} on Job ID: {}", request.getEmail(),
                                                jobId);
                                throw new IllegalStateException("Candidate has already applied for this job");
                        }

                        // Ingest or Link Resume
                        String resumePath = null;
                        String resumeText = null;
                        Candidate existingCandidate = null;

                        if (request.getCandidateId() != null) {
                            existingCandidate = candidateRepository.findById(request.getCandidateId()).orElse(null);
                        }

                        // Determine folder structure names for potential use
                        String vendorName = "Direct_Applicants";
                        if (vendor != null) {
                            vendorName = vendor.getName().replaceAll("[^a-zA-Z0-9._-]", "_");
                        }
                        String applicantName = (request.getFirstName() + "_" + request.getLastName()).replaceAll("[^a-zA-Z0-9._-]", "_");
                        
                        // Construct target resume path: job-applications/<vendor>/<applicant>/resume/<applicant>.ext
                        // Note: Extension might be unknown if we don't have the file yet, but we will determine it.

                        if (resumeFile != null && !resumeFile.isEmpty()) {
                                log.debug("Processing new resume file upload: {}", resumeFile.getOriginalFilename());
                                
                                String originalFilename = resumeFile.getOriginalFilename();
                                String extension = "pdf";
                                if (originalFilename != null && originalFilename.contains(".")) {
                                    extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1);
                                }
                                
                                String customPath = String.format("job-applications/%s/%s/resume/%s.%s", 
                                    vendorName, applicantName, applicantName, extension);
                                
                                var result = ingestionService.storeAndExtract(resumeFile, customPath);
                                resumePath = result.filePath();
                                resumeText = result.extractedText();
                                
                        } else if (existingCandidate != null && existingCandidate.getResumeFilePath() != null) {
                                log.debug("Using existing resume for candidate: {}", existingCandidate.getId());
                                String currentPath = existingCandidate.getResumeFilePath();
                                
                                // Check if we need to move it
                                if (!currentPath.startsWith("job-applications/")) {
                                    log.info("Moving resume from legacy/generic path '{}' to application structure", currentPath);
                                    
                                    // Determine extension from current path
                                    String extension = "pdf";
                                    if (currentPath.contains(".")) {
                                        extension = currentPath.substring(currentPath.lastIndexOf(".") + 1);
                                    }
                                    
                                    String newPath = String.format("job-applications/%s/%s/resume/%s.%s", 
                                        vendorName, applicantName, applicantName, extension);
                                        
                                    // Move the file
                                    try {
                                        ingestionService.moveKey(currentPath, newPath);
                                        
                                        // Update Candidate
                                        existingCandidate.setResumeFilePath(newPath);
                                        candidateRepository.save(existingCandidate);
                                        
                                        resumePath = newPath;
                                    } catch (Exception e) {
                                        log.error("Failed to move resume file for candidate: {}", existingCandidate.getId(), e);
                                        // Fallback to existing path if move fails
                                        resumePath = currentPath;
                                    }
                                } else {
                                    // Already in correct structure, just link it
                                    resumePath = currentPath;
                                }
                                resumeText = ingestionService.extractTextFromPath(resumePath);
                        }

                        JobApplication app = JobApplication.builder()
                                        .job(job)
                                        .firstName(request.getFirstName())
                                        .lastName(request.getLastName())
                                        .email(request.getEmail())
                                        .email(request.getEmail())
                                        .phone(request.getPhone())
                                        .candidate(existingCandidate)
                                        .resumeUrl(request.getResumeUrl()) // Optional external URL
                                        .resumeFilePath(resumePath) // Internal Path
                                        .resumeText(resumeText) // Extracted Text
                                        .currentTitle(request.getCurrentTitle())
                                        .currentCompany(request.getCurrentCompany())
                                        .experienceYears(request.getExperienceYears())
                                        .linkedinUrl(request.getLinkedinUrl())
                                        .portfolioUrl(request.getPortfolioUrl())
                                        .skills(request.getSkills())
                                        .location(request.getLocation())
                                        .vendor(vendor)
                                        .status(ApplicationStatus.APPLIED) // Public/Direct applications start as APPLIED
                                        .build();

                        applicationRepository.save(app);
                        log.info("Application saved with ID: {}", app.getId());

                        UUID targetUserId = employeeRepository.findByEmail(request.getEmail())
                                        .map(Employee::getId).orElse(null);

                        timelineService.createEvent(job.getOrganization().getId(), "APPLICATION", app.getId(), "APPLY",
                                        "New Application", null, targetUserId,
                                        "New Application received from " + request.getFirstName() + " "
                                                        + request.getLastName(),
                                        null);

                        // Notify Job Organization (Client/Solventek) Admins with rich notification
                        List<Employee> admins = employeeRepository
                                        .findByOrganizationId(job.getOrganization().getId());
                        log.debug("Notifying {} admins about new application", admins.size());
                        for (var admin : admins) {
                                notificationService.sendNotification(
                                                NotificationService.NotificationBuilder
                                                                .create()
                                                                .recipient(admin.getId())
                                                                .title("📋 New Application Received")
                                                                .body(request.getFirstName() + " "
                                                                                + request.getLastName()
                                                                                + " applied for "
                                                                                + job.getTitle() + ". "
                                                                                + (request.getExperienceYears() != null
                                                                                                ? request.getExperienceYears()
                                                                                                                + " years of experience."
                                                                                                : ""))
                                                                .category(NotificationCategory.APPLICATION)
                                                                .priority(NotificationPriority.NORMAL)
                                                                .refEntity("APPLICATION", app.getId())
                                                                .actionUrl("/applications/" + app.getId())
                                                                .icon("bi-file-earmark-person")
                                                                .withMetadata("jobTitle", job.getTitle())
                                                                .withMetadata("candidateName", request.getFirstName()
                                                                                + " "
                                                                                + request.getLastName()));
                        }

                        // Notify Candidate if they are a registered user
                        if (targetUserId != null) {
                                notificationService.sendNotification(
                                        NotificationService.NotificationBuilder.create()
                                                .recipient(targetUserId)
                                                .title("Application Submitted Successfully")
                                                .body("Your application for " + job.getTitle() + " at " + job.getOrganization().getName() + " has been received.")
                                                .category(NotificationCategory.APPLICATION)
                                                .priority(NotificationPriority.NORMAL)
                                                .refEntity("APPLICATION", app.getId())
                                                .actionUrl("/applications/" + app.getId())
                                                .icon("bi-check-circle")
                                );
                        }

                        // Trigger AI Analysis AFTER the transaction commits
                        // This prevents the race condition where async thread can't find the
                        // uncommitted application
                        final UUID applicationId = app.getId();
                        final boolean hasResumeText = resumeText != null;

                        if (hasResumeText && TransactionSynchronizationManager.isSynchronizationActive()) {
                                TransactionSynchronizationManager
                                                .registerSynchronization(new TransactionSynchronization() {
                                                        @Override
                                                        public void afterCommit() {
                                                                log.info("Transaction committed, triggering async analysis for application: {}",
                                                                                applicationId);
                                                                try {
                                                                        analysisOrchestrator.analyzeApplicationAsync(
                                                                                        applicationId);
                                                                } catch (Exception e) {
                                                                        log.error("Failed to trigger async analysis after commit",
                                                                                        e);
                                                                }
                                                        }
                                                });
                        } else if (hasResumeText) {
                                // Fallback if no transaction synchronization is active
                                log.warn("No transaction synchronization active, triggering analysis directly");
                                analysisOrchestrator.analyzeApplicationAsync(applicationId);
                        }

                        return enhanceApplication(app);
                } catch (Exception e) {
                        log.error("Error processing application for Job ID: {}: {}", jobId, e.getMessage(), e);
                        throw e;
                }
        }

        @Transactional
        public JobApplication updateStatus(UUID applicationId, ApplicationStatus status) {
                log.info("Updating status for Application ID: {} to {}", applicationId, status);
                try {
                        JobApplication app = applicationRepository.findById(applicationId)
                                        .orElseThrow(() -> new EntityNotFoundException(
                                                        "Application not found: " + applicationId));
                        ApplicationStatus oldStatus = app.getStatus();
                        app.setStatus(status);
                        applicationRepository.save(app);

                        UUID targetUserId = employeeRepository.findByEmail(app.getEmail())
                                        .map(Employee::getId).orElse(null);

                        timelineService.createEvent(app.getJob().getOrganization().getId(), "APPLICATION", app.getId(),
                                        "STATUS_CHANGE", "Status Updated",
                                        null, targetUserId, "Status changed to " + status, null);

                        // Notify Vendor Admins with TRACKING category (shows in Track Applications)
                        if (app.getVendor() != null) {
                                List<Employee> vendorAdmins = employeeRepository
                                                .findByOrganizationId(app.getVendor().getId());
                                log.debug("Notifying {} vendor admins about status update", vendorAdmins.size());
                                String statusEmoji = getStatusEmoji(status);
                                for (var admin : vendorAdmins) {
                                        notificationService.sendNotification(
                                                        NotificationService.NotificationBuilder
                                                                        .create()
                                                                        .recipient(admin.getId())
                                                                        .title(statusEmoji
                                                                                        + " Application Status Updated")
                                                                        .body("Candidate " + app.getFirstName() + " "
                                                                                        + app.getLastName()
                                                                                        + " for "
                                                                                        + app.getJob().getTitle()
                                                                                        + " moved from "
                                                                                        + oldStatus + " to " + status)
                                                                        .category(NotificationCategory.TRACKING)
                                                                        .priority(status == ApplicationStatus.ONBOARDED
                                                                                        ? NotificationPriority.HIGH
                                                                                        : NotificationPriority.NORMAL)
                                                                        .refEntity("APPLICATION", app.getId())
                                                                        .actionUrl("/track-applications")
                                                                        .icon("bi-arrow-left-right")
                                                                        .withMetadata("oldStatus", oldStatus.name())
                                                                        .withMetadata("newStatus", status.name())
                                                                        .withMetadata("candidateName", app
                                                                                        .getFirstName() + " "
                                                                                        + app.getLastName()));
                                }
                        }

                        // Notify Candidate
                        if (targetUserId != null) {
                                notificationService.sendNotification(
                                        NotificationService.NotificationBuilder.create()
                                                .recipient(targetUserId)
                                                .title("Application Status Update")
                                                .body("Your application for " + app.getJob().getTitle() + " has been updated to: " + status)
                                                .category(NotificationCategory.APPLICATION)
                                                .priority(NotificationPriority.NORMAL)
                                                .refEntity("APPLICATION", app.getId())
                                                .actionUrl("/applications/" + app.getId())
                                                .icon("bi-info-circle")
                                );
                        }
                        log.info("Status updated successfully for Application ID: {}", applicationId);
                        return enhanceApplication(app);
                } catch (Exception e) {
                        log.error("Error updating status for Application ID: {}: {}", applicationId, e.getMessage(), e);
                        throw e;
                }
        }

        private String getStatusEmoji(ApplicationStatus status) {
                log.trace("Getting emoji for status: {}", status);
                return switch (status) {
                        case ONBOARDED -> "🎉";
                        case REJECTED, DROPPED -> "❌";
                        case OFFERED -> "💼";
                        case INTERVIEW_SCHEDULED -> "📅";
                        case SHORTLISTED -> "⭐";
                        case INTERVIEW_PASSED -> "✅";
                        case INTERVIEW_FAILED -> "😔";
                        case ONBOARDING_IN_PROGRESS -> "";
                        default -> "🔄";
                };
        }

        @Transactional
        public void withdrawApplication(UUID applicationId) {
                log.info("Withdrawing application ID: {}", applicationId);
                JobApplication app = applicationRepository.findById(applicationId)
                                .orElseThrow(() -> new EntityNotFoundException("Application not found"));
                UUID targetUserId = employeeRepository.findByEmail(app.getEmail())
                                .map(com.solventek.silverwind.auth.Employee::getId).orElse(null);

                timelineService.createEvent(app.getJob().getOrganization().getId(),
                                "APPLICATION", applicationId, "DELETE", "Application Withdrawn", null, targetUserId,
                                "Application deleted/withdrawn", null);

                applicationRepository.delete(app);
        }

        @Transactional(readOnly = true)
        public Page<JobApplication> getApplicationsForJob(UUID jobId, Pageable pageable) {
                log.debug("Fetching applications for Job ID: {}", jobId);
                Page<JobApplication> page = applicationRepository.findByJobId(jobId, pageable);
                page.forEach(this::enhanceApplication);
                return page;
        }

        @Transactional(readOnly = true)
        public Page<JobApplication> getOutboundApplications(UUID vendorId, Pageable pageable) {
                log.debug("Fetching outbound applications for Vendor ID: {}", vendorId);
                // Applications SENT by this organization
                Page<JobApplication> page = applicationRepository.findByVendorId(vendorId, pageable);
                page.forEach(this::enhanceApplication);
                return page;
        }

        @Transactional(readOnly = true)
        public Page<JobApplication> getInboundApplications(UUID orgId, Pageable pageable) {
                log.debug("Fetching inbound applications for Org ID: {}", orgId);
                // Applications RECEIVED by this organization (for my jobs)
                Page<JobApplication> page = applicationRepository.findByJobOrganizationId(orgId, pageable);
                page.forEach(this::enhanceApplication);
                return page;
        }

        // Deprecated or removed: getApplicationsForVendor
        // public Page<JobApplication> getApplicationsForVendor(UUID vendorId, Pageable
        // pageable) ...

        public Page<JobApplication> getApplicationsForClient(UUID clientId, Pageable pageable) {
                log.debug("Fetching applications for Client ID: {}", clientId);
                Page<JobApplication> page = applicationRepository.findByJobOrganizationId(clientId, pageable);
                page.forEach(this::enhanceApplication);
                return page;
        }

        @Transactional
        public JobApplication makeClientDecision(UUID applicationId, boolean approved, String feedback) {
                log.info("Processing client decision for Application ID: {}. Approved: {}", applicationId, approved);
                try {
                        JobApplication app = applicationRepository.findById(applicationId)
                                        .orElseThrow(() -> new EntityNotFoundException("Application not found"));

                        if (approved) {
                                app.setStatus(ApplicationStatus.OFFERED);
                        } else {
                                app.setStatus(ApplicationStatus.REJECTED);
                        }

                        applicationRepository.save(app);

                        UUID targetUserId = employeeRepository.findByEmail(app.getEmail())
                                        .map(com.solventek.silverwind.auth.Employee::getId).orElse(null);

                        timelineService.createEvent(app.getJob().getOrganization().getId(), "APPLICATION", app.getId(),
                                        "CLIENT_DECISION", "Client Decision",
                                        null, targetUserId,
                                        "Client Decision: " + (approved ? "Approved" : "Rejected") + ". Feedback: "
                                                        + feedback,
                                        null);

                        // Notify Vendor
                        if (app.getVendor() != null) {
                                List<Employee> vendorAdmins = employeeRepository
                                                .findByOrganizationId(app.getVendor().getId());
                                log.debug("Notifying vendor about decision for Application ID: {}", applicationId);
                                vendorAdmins.forEach(admin -> notificationService.sendNotification(admin.getId(),
                                                "Client Decision Made",
                                                "Client has " + (approved ? "approved" : "rejected") + " candidate for "
                                                                + app.getJob().getTitle(),
                                                "APPLICATION", app.getId()));
                        }

                        // Notify Candidate
                        if (targetUserId != null) {
                                notificationService.sendNotification(
                                        NotificationService.NotificationBuilder.create()
                                                .recipient(targetUserId)
                                                .title("Application Decision Update")
                                                .body("An update has been made to your application for " + app.getJob().getTitle() + ". Please check your status.")
                                                .category(NotificationCategory.APPLICATION)
                                                .priority(NotificationPriority.HIGH)
                                                .refEntity("APPLICATION", app.getId())
                                                .actionUrl("/applications/" + app.getId())
                                                .icon(approved ? "bi-check-circle-fill" : "bi-x-circle-fill")
                                );
                        }

                        log.info("Client decision processed for Application ID: {}", applicationId);
                        return enhanceApplication(app);
                } catch (Exception e) {
                        log.error("Error processing client decision for Application ID: {}: {}", applicationId,
                                        e.getMessage(), e);
                        throw e;
                }
        }

        // --- Document Management ---

        @Transactional
        public void uploadDocument(UUID applicationId, String category, MultipartFile file, String uploadedBy) {
                log.info("Uploading document '{}' (Category: {}) for Application ID: {} by {}",
                                file.getOriginalFilename(), category, applicationId, uploadedBy);
                JobApplication app = applicationRepository.findById(applicationId).orElseThrow();
                
                // Determine folder structure names
                String vendorName = "Direct_Applicants";
                if (app.getVendor() != null) {
                    vendorName = app.getVendor().getName().replaceAll("[^a-zA-Z0-9._-]", "_");
                }
                String applicantName = (app.getFirstName() + "_" + app.getLastName()).replaceAll("[^a-zA-Z0-9._-]", "_");
                
                String originalFilename = file.getOriginalFilename();
                String extension = "";
                String baseFilename = "file";
                
                if (originalFilename != null) {
                    int dotIndex = originalFilename.lastIndexOf(".");
                    if (dotIndex != -1) {
                        extension = originalFilename.substring(dotIndex); // includes dot
                        baseFilename = originalFilename.substring(0, dotIndex);
                    } else {
                        baseFilename = originalFilename;
                    }
                }
                
                String sanitizedCategory = category.replaceAll("[^a-zA-Z0-9._-]", "_");
                String sanitizedFilename = baseFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
                
                // Construct path: job-applications/<vendor>/<applicant>/documents/<category>-<filename>.ext
                String customPath = String.format("job-applications/%s/%s/documents/%s-%s%s", 
                                    vendorName, applicantName, sanitizedCategory, sanitizedFilename, extension);

                var result = ingestionService.storeAndExtract(file, customPath);

                ApplicationDocuments doc = ApplicationDocuments.builder()
                                .application(app)
                                .category(category)
                                .fileName(file.getOriginalFilename())
                                .filePath(result.filePath())
                                .uploadedBy(uploadedBy)
                                .build();

                documentsRepository.save(doc);

                UUID targetUserId = employeeRepository.findByEmail(app.getEmail())
                                .map(com.solventek.silverwind.auth.Employee::getId).orElse(null);

                timelineService.createEvent(app.getJob().getOrganization().getId(), "APPLICATION", app.getId(),
                                "DOCUMENT_UPLOAD", "Document Uploaded", null, targetUserId,
                                "Document uploaded: " + category, null);
        }

        public List<ApplicationDocuments> getDocuments(UUID applicationId) {
                log.debug("Fetching documents for Application ID: {}", applicationId);
                return documentsRepository.findByApplicationIdOrderByUploadedAtDesc(applicationId);
        }

        public ResumeAnalysis getLatestAnalysis(UUID applicationId) {
                log.debug("Fetching latest analysis for Application ID: {}", applicationId);
                return analysisRepository.findTopByApplicationIdOrderByAnalyzedAtDesc(applicationId).orElse(null);
        }

        @Async("analysisExecutor")
        public void triggerManualAnalysis(UUID applicationId) {
                log.info("Triggering manual analysis for Application ID: {}", applicationId);
                analysisOrchestrator.analyzeApplicationAsync(applicationId);
        }

        public Page<TimelineEvent> getTimeline(UUID applicationId,
                        Pageable pageable) {
                log.debug("Fetching timeline for Application ID: {}", applicationId);
                return timelineService.getApplicationTimeline(applicationId, pageable);
        }

        public ApplicationDocuments getDocument(UUID docId) {
                log.debug("Fetching document ID: {}", docId);
                return documentsRepository.findById(docId)
                                .orElseThrow(() -> new EntityNotFoundException("Document not found"));
        }

        public void addTimelineEvent(UUID applicationId, String message, String title, String userId) {
                log.info("Adding timeline event '{}' to Application ID: {} by User: {}", title, applicationId, userId);
                // Determine Actor ID from userId (username)
                // Ideally we look up user by username.
                // For now, let's assume we pass the User object or look it up.
                Employee actor = employeeRepository.findByEmail(userId).orElse(null);
                UUID actorId = actor != null ? actor.getId() : null;

                JobApplication app = getApplication(applicationId);

                UUID targetUserId = employeeRepository.findByEmail(app.getEmail())
                                .map(com.solventek.silverwind.auth.Employee::getId).orElse(null);

                timelineService.createEvent(app.getJob().getOrganization().getId(),
                                "APPLICATION", applicationId, "COMMENT", title, actorId, targetUserId, message, null);

                // --- Notifications ---
                if (actor != null) {
                        try {
                                // 1. Notify Actor (Confirmation)
                                notificationService.sendNotification(
                                        NotificationService.NotificationBuilder.create()
                                                .recipient(actor.getId())
                                                .title("Comment Added")
                                                .body("You added a comment to " + app.getFirstName() + " " + app.getLastName() + "'s application.")
                                                .category(NotificationCategory.APPLICATION)
                                                .priority(NotificationPriority.LOW)
                                                .refEntity("APPLICATION", app.getId())
                                                .actionUrl("/applications/" + app.getId())
                                                .icon("bi-chat-left-text")
                                );

                                // 2. Notify Target Audience
                                // Determine if Actor is Vendor or Client
                                boolean isActorVendor = app.getVendor() != null && app.getVendor().getId().equals(actor.getOrganization().getId());
                                Organization targetOrg = isActorVendor ? app.getJob().getOrganization() : app.getVendor();

                                if (targetOrg != null) {
                                        java.util.List<com.solventek.silverwind.auth.Employee> recipients = employeeRepository.findByOrganizationId(targetOrg.getId());
                                        
                                        for (Employee recipient : recipients) {
                                                // Don't notify self if logic somehow overlaps
                                                if (recipient.getId().equals(actor.getId())) continue;

                                                notificationService.sendNotification(
                                                        NotificationService.NotificationBuilder.create()
                                                                .recipient(recipient.getId())
                                                                .title("New Comment on Application")
                                                                .body(actor.getFirstName() + " added a comment: \"" + (message.length() > 50 ? message.substring(0, 47) + "..." : message) + "\"")
                                                                .category(NotificationCategory.APPLICATION)
                                                                .priority(NotificationPriority.NORMAL)
                                                                .refEntity("APPLICATION", app.getId())
                                                                .actionUrl("/applications/" + app.getId())
                                                                .icon("bi-chat-dots")
                                                                .withMetadata("commenter", actor.getFirstName() + " " + actor.getLastName())
                                                );
                                        }
                                }

                        } catch (Exception e) {
                                log.error("Failed to send comment notifications", e);
                                // Don't fail the transaction just because notification failed
                        }
                }
        }

        public JobApplication getApplication(UUID id) {
                log.debug("Fetching Application ID: {}", id);
                JobApplication app = applicationRepository.findById(id)
                                .orElseThrow(() -> new EntityNotFoundException("Application not found"));
                return enhanceApplication(app);
        }
    public org.springframework.core.io.Resource downloadResume(UUID applicationId) {
        JobApplication app = getApplication(applicationId);
        if (app.getResumeFilePath() == null) {
            throw new EntityNotFoundException("Resume not found for application");
        }
        return ingestionService.downloadResume(app.getResumeFilePath());
    }

    public org.springframework.core.io.Resource downloadDocumentResource(UUID docId) {
        ApplicationDocuments doc = getDocument(docId);
        return ingestionService.downloadResume(doc.getFilePath());
    }
    private JobApplication enhanceApplication(JobApplication app) {
        if (app != null) {
            if (app.getJob() != null && app.getJob().getOrganization() != null) {
                organizationService.enhanceOrganization(app.getJob().getOrganization());
            }
            if (app.getVendor() != null) {
                organizationService.enhanceOrganization(app.getVendor());
            }
        }
        return app;
    }
}
