package com.solventek.silverwind.tracking.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CandidateDashboardDTO {
    private UUID applicationId;
    private String candidateName;
    private String jobTitle;
    private String status;
    private String currentStage;
    private LocalDateTime appliedAt;
    private List<TimelineEventDTO> timeline;
    private String trackingToken;
    private List<DocumentDTO> documents;
}
