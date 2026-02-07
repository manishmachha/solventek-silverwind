package com.solventek.silverwind.projects.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Minimal organization info for project responses
 */
@Data
@Builder
public class OrganizationSummary {
    private UUID id;
    private String name;
    private String type;
}
