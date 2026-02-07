package com.solventek.silverwind.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * DTO for Role information
 */
@Data
@Builder
public class RoleDto {
    private UUID id;
    private String name;
    private String description;
}
