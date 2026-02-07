package com.solventek.silverwind.tracking.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

import java.util.UUID;

@Data
@Builder
public class TimelineEventDTO {
    private UUID id;
    private String eventType;
    private String title;
    private String description;
    private String createdBy;
    private LocalDateTime createdAt;
}
