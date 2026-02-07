package com.solventek.silverwind.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Minimal manager info for employee responses to avoid circular references
 */
@Data
@Builder
public class ManagerSummary {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String profilePhotoUrl;
}
