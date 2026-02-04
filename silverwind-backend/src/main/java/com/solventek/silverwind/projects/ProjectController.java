package com.solventek.silverwind.projects;

import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Project management controller - Solventek only
 */
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<Project>>> getProjects(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getMyProjects(currentUser.getOrgId())));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Project>> createProject(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody @Valid CreateProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.createProject(currentUser.getOrgId(), request.name, request.description,
                        request.clientOrgId, request.startDate, request.endDate)));
    }

    @PostMapping("/{id}/allocate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<ProjectAllocation>> allocateUser(
            @PathVariable UUID id,
            @RequestBody @Valid AllocateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.allocateUser(id, request.userId, request.startDate, request.endDate, request.percentage,
                        request.billingRole)));
    }

    @GetMapping("/{id}/allocations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<ProjectAllocation>>> getAllocations(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectAllocations(id)));
    }

    @Data
    public static class CreateProjectRequest {
        @NotBlank
        private String name;
        private String description;
        private UUID clientOrgId;
        private LocalDate startDate;
        private LocalDate endDate;
    }

    @Data
    public static class AllocateUserRequest {
        @NotNull
        private UUID userId;
        @NotNull
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer percentage = 100;
        private String billingRole;
    }
}
