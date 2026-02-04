package com.solventek.silverwind.interviews;

import com.solventek.silverwind.applications.ApplicationStatus;
import com.solventek.silverwind.applications.JobApplication;
import com.solventek.silverwind.applications.JobApplicationRepository;
import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.timeline.TimelineService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewService {

        private final InterviewRepository interviewRepository;
        private final JobApplicationRepository applicationRepository;
        private final EmployeeRepository employeeRepository;
        private final TimelineService timelineService;
        private final com.solventek.silverwind.notifications.NotificationService notificationService;

        @Transactional
        public Interview scheduleInterview(UUID applicationId, UUID interviewerId, LocalDateTime scheduledAt,
                        Integer durationMinutes, InterviewType type, String meetingLink) {
                log.info("Scheduling interview for Application ID: {} with Interviewer ID: {}", applicationId,
                                interviewerId);
                try {
                        JobApplication app = applicationRepository.findById(applicationId)
                                        .orElseThrow(() -> new EntityNotFoundException(
                                                        "Application not found: " + applicationId));

                        Employee interviewer = employeeRepository.findById(interviewerId)
                                        .orElseThrow(() -> new EntityNotFoundException(
                                                        "Interviewer not found: " + interviewerId));

                        Interview interview = Interview.builder()
                                        .application(app)
                                        .interviewer(interviewer)
                                        .scheduledAt(scheduledAt)
                                        .durationMinutes(durationMinutes)
                                        .type(type)
                                        .status(InterviewStatus.SCHEDULED)
                                        .meetingLink(meetingLink)
                                        .build();

                        interviewRepository.save(interview);

                        // Update application status
                        app.setStatus(ApplicationStatus.INTERVIEW_SCHEDULED);
                        applicationRepository.save(app);

                        // Create timeline event
                        timelineService.createEvent(app.getJob().getOrganization().getId(), "INTERVIEW",
                                        interview.getId(),
                                        "SCHEDULED", "Interview Scheduled", null,
                                        "Interview scheduled with " + interviewer.getFullName() + " for " + scheduledAt,
                                        null);

                        // Notify Interviewer
                        notificationService.sendNotification(interviewer.getId(), "Interview Scheduled", 
                                "You have an interview scheduled for " + app.getJob().getTitle() + " at " + scheduledAt, 
                                "INTERVIEW", interview.getId());

                        // Notify Candidate if registered
                        employeeRepository.findByEmail(app.getEmail()).ifPresent(candidate -> {
                                notificationService.sendNotification(candidate.getId(), "Interview Scheduled", 
                                        "An interview for " + app.getJob().getTitle() + " has been scheduled for " + scheduledAt, 
                                        "INTERVIEW", interview.getId());
                        });

                        log.info("Interview scheduled successfully: {}", interview.getId());
                        return interview;
                } catch (Exception e) {
                        log.error("Error scheduling interview for Application ID: {}: {}", applicationId,
                                        e.getMessage(), e);
                        throw e;
                }
        }

        @Transactional
        public Interview submitFeedback(UUID interviewId, String feedback, Integer rating, boolean passed) {
                log.info("Submitting feedback for Interview ID: {}", interviewId);
                try {
                        Interview interview = interviewRepository.findById(interviewId)
                                        .orElseThrow(() -> new EntityNotFoundException(
                                                        "Interview not found: " + interviewId));

                        interview.setFeedback(feedback);
                        interview.setRating(rating);
                        interview.setStatus(InterviewStatus.COMPLETED);
                        interviewRepository.save(interview);

                        JobApplication app = interview.getApplication();
                        if (passed) {
                                app.setStatus(ApplicationStatus.INTERVIEW_PASSED);
                        } else {
                                app.setStatus(ApplicationStatus.INTERVIEW_FAILED);
                        }
                        applicationRepository.save(app);

                        timelineService.createEvent(app.getJob().getOrganization().getId(), "INTERVIEW",
                                        interview.getId(),
                                        "FEEDBACK", "Interview Feedback", null,
                                        "Interview completed. Result: " + (passed ? "Passed" : "Failed"),
                                        null);

                        // Notify Candidate if registered
                        employeeRepository.findByEmail(app.getEmail()).ifPresent(candidate -> {
                                notificationService.sendNotification(candidate.getId(), "Interview Feedback", 
                                        "Your interview for " + app.getJob().getTitle() + " has been marked as " + (passed ? "Passed" : "Failed"), 
                                        "INTERVIEW", interview.getId());
                        });

                        log.info("Feedback submitted for Interview ID: {}", interviewId);
                        return interview;
                } catch (Exception e) {
                        log.error("Error submitting feedback for Interview ID: {}: {}", interviewId, e.getMessage(), e);
                        throw e;
                }
        }

        public List<Interview> getInterviewsForApplication(UUID applicationId) {
                log.debug("Fetching interviews for Application ID: {}", applicationId);
                return interviewRepository.findByApplicationId(applicationId);
        }
}
