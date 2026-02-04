package com.solventek.silverwind.onboarding;

import com.solventek.silverwind.applications.ApplicationStatus;
import com.solventek.silverwind.applications.JobApplication;
import com.solventek.silverwind.applications.JobApplicationRepository;
import com.solventek.silverwind.timeline.TimelineService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OnboardingService {
    private final OnboardingRepository onboardingRepository;
    private final JobApplicationRepository applicationRepository;
    private final TimelineService timelineService;
    private final com.solventek.silverwind.auth.EmployeeRepository employeeRepository;
    private final com.solventek.silverwind.notifications.NotificationService notificationService;

    @Transactional
    public Onboarding initiateOnboarding(UUID applicationId) {
        log.info("Initiating onboarding for Application ID: {}", applicationId);
        try {
            JobApplication app = applicationRepository.findById(applicationId)
                    .orElseThrow(() -> new EntityNotFoundException("Application not found: " + applicationId));

            if (app.getStatus() != ApplicationStatus.OFFERED) {
                log.warn("Onboarding initiation failed: Application {} is not in OFFERED status (Current: {})",
                        applicationId, app.getStatus());
                throw new IllegalStateException("Application must be in OFFERED status to start onboarding");
            }

            if (onboardingRepository.findByApplicationId(applicationId).isPresent()) {
                log.warn("Onboarding initiation failed: Already initiated for Application {}", applicationId);
                throw new IllegalStateException("Onboarding already initiated for this application");
            }

            Onboarding onboarding = Onboarding.builder()
                    .application(app)
                    .status(OnboardingStatus.PENDING_DOCS)
                    .build();

            onboardingRepository.save(onboarding);

            app.setStatus(ApplicationStatus.ONBOARDING_IN_PROGRESS);
            applicationRepository.save(app);

            UUID targetUserId = employeeRepository.findByEmail(app.getEmail())
                    .map(com.solventek.silverwind.auth.Employee::getId).orElse(null);

            timelineService.createEvent(app.getJob().getOrganization().getId(), "APPLICATION", app.getId(),
                    "ONBOARDING_INITIATED", "Onboarding Initiated", null, targetUserId, "Onboarding Process Started",
                    null);

            // Notify Candidate
            if (targetUserId != null) {
                notificationService.sendNotification(targetUserId, "Onboarding Initiated",
                        "Onboarding has been initiated for your application to " + app.getJob().getTitle(), "ONBOARDING", onboarding.getId());
            }

            log.info("Onboarding initiated successfully for Application ID: {}", applicationId);
            return onboarding;
        } catch (Exception e) {
            log.error("Error initiating onboarding for Application ID: {}: {}", applicationId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Onboarding uploadDocument(UUID onboardingId, String documentUrl) {
        log.info("Uploading document to Onboarding ID: {}", onboardingId);
        try {
            Onboarding onboarding = onboardingRepository.findById(onboardingId)
                    .orElseThrow(() -> new EntityNotFoundException("Onboarding record not found: " + onboardingId));

            onboarding.getDocuments().add(documentUrl);
            onboarding.setStatus(OnboardingStatus.VERIFICATION_PENDING);

            // Audit log?
            // Audit log
            UUID targetUserId = employeeRepository.findByEmail(onboarding.getApplication().getEmail())
                    .map(com.solventek.silverwind.auth.Employee::getId).orElse(null);

            timelineService.createEvent(onboarding.getApplication().getJob().getOrganization().getId(), "ONBOARDING",
                    onboardingId,
                    "DOC_UPLOAD", "Document Uploaded", null, targetUserId, "Onboarding Document Uploaded", null);

            // Notify Org Admins
            notificationService.sendNotificationToOrgAdmins(onboarding.getApplication().getJob().getOrganization().getId(),
                    "Onboarding Documents Uploaded",
                    "Candidate " + onboarding.getApplication().getFirstName() + " has uploaded onboarding documents.",
                    "ONBOARDING", onboardingId);

            Onboarding saved = onboardingRepository.save(onboarding);
            log.info("Document uploaded successfully for Onboarding ID: {}", onboardingId);
            return saved;
        } catch (Exception e) {
            log.error("Error uploading document for Onboarding ID: {}: {}", onboardingId, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public Onboarding completeOnboarding(UUID onboardingId, LocalDate startDate) {
        log.info("Completing onboarding for Onboarding ID: {}", onboardingId);
        try {
            Onboarding onboarding = onboardingRepository.findById(onboardingId)
                    .orElseThrow(() -> new EntityNotFoundException("Onboarding record not found: " + onboardingId));

            onboarding.setStatus(OnboardingStatus.COMPLETED);
            if (startDate != null) {
                onboarding.setStartDate(startDate);
            }
            onboardingRepository.save(onboarding);

            JobApplication app = onboarding.getApplication();
            app.setStatus(ApplicationStatus.ONBOARDED);
            applicationRepository.save(app);

            UUID targetUserId = employeeRepository.findByEmail(app.getEmail())
                    .map(com.solventek.silverwind.auth.Employee::getId).orElse(null);

            timelineService.createEvent(app.getJob().getOrganization().getId(), "APPLICATION", app.getId(),
                    "ONBOARDING_COMPLETED", "Onboarding Completed", null, targetUserId,
                    "Candidate Onboarding Completed. Join Date: " + startDate, null);

            // Notify Candidate
            if (targetUserId != null) {
                notificationService.sendNotification(targetUserId, "Onboarding Completed",
                        "Congratulations! Your onboarding is complete. You can now access your employee portal.", "ONBOARDING", onboardingId);
            }

            log.info("Onboarding completed successfully for Onboarding ID: {}", onboardingId);
            return onboarding;
        } catch (Exception e) {
            log.error("Error completing onboarding for Onboarding ID: {}: {}", onboardingId, e.getMessage(), e);
            throw e;
        }
    }

    public Onboarding getOnboarding(UUID onboardingId) {
        log.debug("Fetching Onboarding ID: {}", onboardingId);
        return onboardingRepository.findById(onboardingId).orElseThrow(() -> new EntityNotFoundException("Not found"));
    }

    public Onboarding getOnboardingByApplication(UUID applicationId) {
        log.debug("Fetching Onboarding for Application ID: {}", applicationId);
        return onboardingRepository.findByApplicationId(applicationId)
                .orElseThrow(() -> new EntityNotFoundException("Not found"));
    }
}
