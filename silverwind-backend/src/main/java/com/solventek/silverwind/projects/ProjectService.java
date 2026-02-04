package com.solventek.silverwind.projects;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.org.OrganizationRepository;
import com.solventek.silverwind.notifications.NotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.solventek.silverwind.security.UserPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ProjectAllocationRepository allocationRepository;
    private final OrganizationRepository organizationRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationService notificationService;
    private final com.solventek.silverwind.timeline.TimelineService timelineService;

    public List<Project> getMyProjects(UUID internalOrgId) {
        log.debug("Fetching projects for Internal Org ID: {}", internalOrgId);
        return projectRepository.findByInternalOrgId(internalOrgId);
    }

    @Transactional
    public Project createProject(UUID internalOrgId, String name, String description, UUID clientOrgId,
            LocalDate startDate, LocalDate endDate) {
        log.info("Creating project '{}' for Org: {}", name, internalOrgId);
        try {
            Organization internalOrg = organizationRepository.findById(internalOrgId).orElseThrow();
            Organization clientOrg = null;
            if (clientOrgId != null) {
                clientOrg = organizationRepository.findById(clientOrgId)
                        .orElseThrow(() -> new EntityNotFoundException("Client Org not found: " + clientOrgId));
            }

            Project project = Project.builder()
                    .internalOrg(internalOrg)
                    .name(name)
                    .description(description)
                    .client(clientOrg)
                    .startDate(startDate)
                    .endDate(endDate)
                    .status(Project.ProjectStatus.ACTIVE)
                    .build();

            Project saved = projectRepository.save(project);
            log.info("Project created successfully: {}", saved.getId());

            timelineService.createEvent(internalOrgId, "PROJECT", saved.getId(), "CREATE", "Project Created",
                    getCurrentUserId(),
                    "Project Created: " + name, null);
            return saved;
        } catch (Exception e) {
            log.error("Error creating project '{}': {}", name, e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public ProjectAllocation allocateUser(UUID projectId, UUID userId, LocalDate startDate, LocalDate endDate,
            Integer percentage, String billingRole) {
        log.info("Allocating user {} to project {}", userId, projectId);
        try {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));
            Employee employee = employeeRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

            ProjectAllocation allocation = ProjectAllocation.builder()
                    .project(project)
                    .employee(employee)
                    .startDate(startDate)
                    .endDate(endDate)
                    .allocationPercentage(percentage)
                    .billingRole(billingRole)
                    .status(ProjectAllocation.AllocationStatus.ACTIVE)
                    .build();

            ProjectAllocation saved = allocationRepository.save(allocation);
            log.info("User {} allocated successfully to project {}", userId, projectId);

            // Notify User
            notificationService.sendNotification(userId, "Project Allocation",
                    "You have been allocated to project: " + project.getName(), "PROJECT", projectId);

            timelineService.createEvent(project.getInternalOrg().getId(), "PROJECT", projectId, "ALLOCATE",
                    "User Allocated", getCurrentUserId(), userId, "User allocated to project: " + project.getName(),
                    null);

            return saved;
        } catch (Exception e) {
            log.error("Error allocating user {} to project {}: {}", userId, projectId, e.getMessage(), e);
            throw e;
        }
    }

    public List<ProjectAllocation> getProjectAllocations(UUID projectId) {
        log.debug("Fetching allocations for Project ID: {}", projectId);
        return allocationRepository.findByProjectId(projectId);
    }

    public List<ProjectAllocation> getUserAllocations(UUID userId) {
        log.debug("Fetching allocations for User ID: {}", userId);
        return allocationRepository.findByEmployeeId(userId);
    }

    private UUID getCurrentUserId() {
        if (SecurityContextHolder.getContext().getAuthentication() != null &&
                SecurityContextHolder.getContext().getAuthentication().getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getId();
        }
        return null;
    }
}
