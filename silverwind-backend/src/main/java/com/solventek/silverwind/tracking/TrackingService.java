package com.solventek.silverwind.tracking;

import com.solventek.silverwind.applications.ApplicationDocuments;
import com.solventek.silverwind.applications.JobApplicationRepository;
import com.solventek.silverwind.applications.ApplicationService;
import com.solventek.silverwind.applications.JobApplication;
import com.solventek.silverwind.timeline.TimelineEvent;
import com.solventek.silverwind.timeline.TimelineRepository;
import com.solventek.silverwind.timeline.TimelineService;
import com.solventek.silverwind.tracking.dto.CandidateDashboardDTO;
import com.solventek.silverwind.tracking.dto.DocumentDTO;
import com.solventek.silverwind.tracking.dto.TimelineEventDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrackingService {

    private final JobApplicationRepository applicationRepository;
    private final ApplicationService applicationService;
    private final TimelineRepository timelineRepository;
    private final TimelineService timelineService;

    @Transactional(readOnly = true)
    public CandidateDashboardDTO login(UUID applicationId, LocalDate dob) {
        JobApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Application ID"));

        if (app.getDob() == null || !app.getDob().isEqual(dob)) {
             throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Date of Birth");
        }

        String token = app.getId().toString(); 

        return buildDashboard(app, token);
    }

    @Transactional(readOnly = true)
    public CandidateDashboardDTO getDashboard(String token) {
        try {
            UUID appId = UUID.fromString(token);
            JobApplication app = applicationRepository.findById(appId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
            return buildDashboard(app, token);
        } catch (IllegalArgumentException e) {
             throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Token");
        }
    }

    private CandidateDashboardDTO buildDashboard(JobApplication app, String token) {
        var timeline = timelineRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("APPLICATION", app.getId(), Pageable.unpaged())
                .stream()
                .map(this::mapTimelineEvent)
                .collect(Collectors.toList());

        var documents = applicationService.getDocuments(app.getId())
                .stream()
                .map(this::mapDocument)
                .collect(Collectors.toList());

        return CandidateDashboardDTO.builder()
                .applicationId(app.getId())
                .candidateName(app.getFirstName() + " " + app.getLastName())
                .jobTitle(app.getJob().getTitle())
                .status(app.getStatus().name())
                .currentStage(app.getStatus().name()) 
                .appliedAt(app.getCreatedAt())
                .timeline(timeline)
                .trackingToken(token)
                .documents(documents)
                .build();
    }

    @Transactional
    public void addComment(UUID applicationId, String comment) {
        JobApplication app = applicationRepository.findById(applicationId)
             .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        
        timelineService.createEvent(
            app.getJob().getOrganization().getId(), // orgId
            "APPLICATION", // entityType
            app.getId(), // entityId
            "COMMENT", // action
            "Candidate Comment", // title
            null, // actorId (null for candidate)
            null, // targetUserId
            comment, // message
            Map.of("authorName", app.getFirstName() + " " + app.getLastName()) // metadata
        );
    }

    @Transactional
    public void uploadDocument(UUID applicationId, String category, MultipartFile file) {
         JobApplication app = applicationRepository.findById(applicationId)
             .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
         
         applicationService.uploadDocument(applicationId, category, file, app.getFirstName() + " " + app.getLastName());
    }

    private TimelineEventDTO mapTimelineEvent(TimelineEvent event) {
        String createdBy = "System";
        if (event.getMetadata() != null && event.getMetadata().containsKey("authorName")) {
            createdBy = (String) event.getMetadata().get("authorName");
        } else if (event.getActorUserId() != null) {
            // In a real app we would fetch the user name, but for now just ID or generic
            createdBy = "User " + event.getActorUserId().toString().substring(0, 8); 
        }

        return TimelineEventDTO.builder()
                .id(event.getId())
                .eventType(event.getAction()) // Mapping action to eventType
                .title(event.getTitle())
                .description(event.getMessage()) // Mapping message to description
                .createdBy(createdBy)
                .createdAt(event.getCreatedAt())
                .build();
    }

    private DocumentDTO mapDocument(ApplicationDocuments doc) {
        return DocumentDTO.builder()
                .fileName(doc.getFileName())
                .category(doc.getCategory())
                .uploadedBy(doc.getUploadedBy())
                .uploadedAt(doc.getUploadedAt())
                .filePath(doc.getFilePath())
                .build();
    }
}
