package com.solventek.silverwind.projects.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Minimal user info for project allocation responses
 */
@Data
@Builder
public class UserSummary {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String profilePhotoUrl;
}
