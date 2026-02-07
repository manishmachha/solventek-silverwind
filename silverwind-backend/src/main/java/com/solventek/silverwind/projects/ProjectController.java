package com.solventek.silverwind.projects;

import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.projects.dto.ProjectAllocationResponse;
import com.solventek.silverwind.projects.dto.ProjectMapper;
import com.solventek.silverwind.projects.dto.ProjectResponse;
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
 * Project management controller - Full CRUD with allocation management
 */
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectMapper projectMapper;

    // ========== PROJECT CRUD ==========

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getProjects(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<ProjectResponse> projects = projectService.getMyProjects(currentUser.getOrgId()).stream()
                .map(projectMapper::toProjectResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProject(@PathVariable UUID id) {
        Project project = projectService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(projectMapper.toProjectResponse(project)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody @Valid CreateProjectRequest request) {
        Project created = projectService.createProject(currentUser.getOrgId(), request.name, request.description,
                request.clientOrgId, request.startDate, request.endDate);
        return ResponseEntity.ok(ApiResponse.success("Project created successfully.", projectMapper.toProjectResponse(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateProjectRequest request) {
        Project updated = projectService.updateProject(id, request.name, request.description,
                request.clientOrgId, request.startDate, request.endDate);
        return ResponseEntity.ok(ApiResponse.success("Project updated successfully.", projectMapper.toProjectResponse(updated)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestBody @Valid UpdateStatusRequest request) {
        Project updated = projectService.updateStatus(id, request.status);
        return ResponseEntity.ok(ApiResponse.success("Project status updated.", projectMapper.toProjectResponse(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable UUID id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success("Project deleted successfully.", null));
    }

    // ========== ALLOCATION MANAGEMENT ==========

    @GetMapping("/{id}/allocations")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<ProjectAllocationResponse>>> getAllocations(@PathVariable UUID id) {
        List<ProjectAllocationResponse> allocations = projectService.getProjectAllocations(id).stream()
                .map(projectMapper::toAllocationResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(allocations));
    }

    @PostMapping("/{id}/allocate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<ProjectAllocationResponse>> allocateUser(
            @PathVariable UUID id,
            @RequestBody @Valid AllocateUserRequest request) {
        ProjectAllocation allocation = projectService.allocateUser(id, request.userId, request.startDate, request.endDate, request.percentage,
                request.billingRole);
        return ResponseEntity.ok(ApiResponse.success("User allocated to project successfully.", projectMapper.toAllocationResponse(allocation)));
    }

    @PutMapping("/{projectId}/allocations/{allocationId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<ProjectAllocationResponse>> updateAllocation(
            @PathVariable UUID projectId,
            @PathVariable UUID allocationId,
            @RequestBody @Valid UpdateAllocationRequest request) {
        ProjectAllocation updated = projectService.updateAllocation(projectId, allocationId, request.startDate,
                request.endDate, request.percentage, request.billingRole, request.status);
        return ResponseEntity.ok(ApiResponse.success("Allocation updated successfully.", projectMapper.toAllocationResponse(updated)));
    }

    @DeleteMapping("/{projectId}/allocations/{allocationId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TA')")
    public ResponseEntity<ApiResponse<Void>> deallocateUser(
            @PathVariable UUID projectId,
            @PathVariable UUID allocationId) {
        projectService.deallocateUser(projectId, allocationId);
        return ResponseEntity.ok(ApiResponse.success("User deallocated from project.", null));
    }

    // ========== REQUEST DTOs ==========

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
    public static class UpdateProjectRequest {
        private String name;
        private String description;
        private UUID clientOrgId;
        private LocalDate startDate;
        private LocalDate endDate;
    }

    @Data
    public static class UpdateStatusRequest {
        @NotNull
        private Project.ProjectStatus status;
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

    @Data
    public static class UpdateAllocationRequest {
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer percentage;
        private String billingRole;
        private ProjectAllocation.AllocationStatus status;
    }
}
