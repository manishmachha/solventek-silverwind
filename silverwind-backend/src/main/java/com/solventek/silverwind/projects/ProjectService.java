package com.solventek.silverwind.projects;

import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.client.Client;
import com.solventek.silverwind.client.ClientRepository;
import com.solventek.silverwind.org.Organization;
import com.solventek.silverwind.org.OrganizationRepository;
import com.solventek.silverwind.recruitment.Candidate;
import com.solventek.silverwind.recruitment.CandidateRepository;
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
    private final ClientRepository clientRepository;
    private final EmployeeRepository employeeRepository;
    private final CandidateRepository candidateRepository;
    private final NotificationService notificationService;
    private final com.solventek.silverwind.timeline.TimelineService timelineService;

    public List<Project> getMyProjects(UUID internalOrgId) {
        log.debug("Fetching projects for Internal Org ID: {}", internalOrgId);
        return projectRepository.findByInternalOrgId(internalOrgId);
    }

    @Transactional
    public Project createProject(UUID internalOrgId, String name, String description, UUID clientId,
            LocalDate startDate, LocalDate endDate) {
        log.info("Creating project '{}' for Org: {}", internalOrgId, name);
        try {
            Organization internalOrg = organizationRepository.findById(internalOrgId).orElseThrow();
            Client client = null;
            if (clientId != null) {
                client = clientRepository.findById(clientId)
                        .orElseThrow(() -> new EntityNotFoundException("Client not found: " + clientId));
            }

            Project project = Project.builder()
                    .internalOrg(internalOrg)
                    .name(name)
                    .description(description)
                    .client(client)
                    .startDate(startDate)
                    .endDate(endDate)
                    .status(Project.ProjectStatus.ACTIVE)
                    .build();

            Project saved = projectRepository.save(project);
            log.info("Project created successfully: {}", saved.getId());

            timelineService.createEvent(internalOrg.getId(), "PROJECT", saved.getId(), "CREATE", "Project Created",
                    getCurrentUserId(),
                    "Project Created: " + name, null);

            // Notify Org Admins
            notificationService.sendNotificationToOrg(internalOrg.getId(),
                    NotificationService.NotificationBuilder.create()
                            .title("New Project Created")
                            .body("Project '" + name + "' has been created.")
                            .category(com.solventek.silverwind.notifications.Notification.NotificationCategory.PROJECT)
                            .refEntity("PROJECT", saved.getId())
                            .actionUrl("/projects/" + saved.getId())
                            .icon("bi-kanban"));

            return saved;
        } catch (Exception e) {
            log.error("Error creating project '{}': {}", name, e.getMessage(), e);
            throw e;
        }
    }
    // ... (skip allocateUser as it is fine) ...

    @Transactional
    public Project updateProject(UUID projectId, String name, String description, UUID clientOrgId,
            LocalDate startDate, LocalDate endDate) {
        log.info("Updating project: {}", projectId);
        Project project = getById(projectId);

        if (name != null)
            project.setName(name);
        if (description != null)
            project.setDescription(description);
        if (startDate != null)
            project.setStartDate(startDate);
        if (endDate != null)
            project.setEndDate(endDate);

        if (clientOrgId != null) {
            Client client = clientRepository.findById(clientOrgId)
                    .orElseThrow(() -> new EntityNotFoundException("Client not found: " + clientOrgId));
            project.setClient(client);
        }

        Project saved = projectRepository.save(project);
        log.info("Project updated successfully: {}", projectId);

        timelineService.createEvent(project.getInternalOrg().getId(), "PROJECT", projectId, "UPDATE",
                "Project Updated", getCurrentUserId(), "Project details updated", null);

        // Notify Org Admins
        notificationService.sendNotificationToOrg(project.getInternalOrg().getId(),
                NotificationService.NotificationBuilder.create()
                        .title("Project Updated")
                        .body("Project '" + project.getName() + "' details have been updated.")
                        .category(com.solventek.silverwind.notifications.Notification.NotificationCategory.PROJECT)
                        .refEntity("PROJECT", project.getId())
                        .actionUrl("/portal/projects/" + project.getId())
                        .icon("bi-pencil"));

        return saved;
    }

    @Transactional
    public Project updateStatus(UUID projectId, Project.ProjectStatus status) {
        log.info("Updating project status: {} to {}", projectId, status);
        Project project = getById(projectId);
        Project.ProjectStatus oldStatus = project.getStatus();
        project.setStatus(status);
        Project saved = projectRepository.save(project);

        timelineService.createEvent(project.getInternalOrg().getId(), "PROJECT", projectId, "STATUS_CHANGE",
                "Status Changed", getCurrentUserId(), "Project status changed to: " + status, null);

        // Notify Org Admins
        notificationService.sendNotificationToOrg(project.getInternalOrg().getId(),
                NotificationService.NotificationBuilder.create()
                        .title("Project Status Updated")
                        .body("Project '" + project.getName() + "' status changed from " + oldStatus + " to " + status
                                + ".")
                        .category(com.solventek.silverwind.notifications.Notification.NotificationCategory.PROJECT)
                        .refEntity("PROJECT", project.getId())
                        .actionUrl("/portal/projects/" + project.getId())
                        .icon("bi-arrow-repeat"));

        return saved;
    }
    // ... (skip deleteProject and deallocateUser) ...

    @Transactional
    public ProjectAllocation updateAllocation(UUID projectId, UUID allocationId, LocalDate startDate,
            LocalDate endDate, Integer percentage, String billingRole, ProjectAllocation.AllocationStatus status) {
        log.info("Updating allocation: {} for project: {}", allocationId, projectId);
        ProjectAllocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new EntityNotFoundException("Allocation not found: " + allocationId));

        if (!allocation.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Allocation does not belong to project");
        }

        if (startDate != null)
            allocation.setStartDate(startDate);
        if (endDate != null)
            allocation.setEndDate(endDate);
        if (percentage != null)
            allocation.setAllocationPercentage(percentage);
        if (billingRole != null)
            allocation.setBillingRole(billingRole);
        if (status != null)
            allocation.setStatus(status);

        ProjectAllocation saved = allocationRepository.save(allocation);
        log.info("Allocation updated successfully: {}", allocationId);

        UUID userId = allocation.getEmployee() != null ? allocation.getEmployee().getId() : null;
        UUID candidateId = allocation.getCandidate() != null ? allocation.getCandidate().getId() : null;
        UUID orgId = allocation.getProject().getInternalOrg().getId();

        timelineService.createEvent(orgId, "PROJECT", projectId, "ALLOCATION_UPDATE",
                "Allocation Updated", getCurrentUserId(), userId != null ? userId : candidateId,
                "Allocation details updated", null);

        if (userId != null) {
            notificationService.sendNotification(
                    NotificationService.NotificationBuilder.create()
                            .recipient(userId)
                            .title("Allocation Updated")
                            .body("Your allocation on project '" + allocation.getProject().getName()
                                    + "' has been updated.")
                            .category(com.solventek.silverwind.notifications.Notification.NotificationCategory.PROJECT)
                            .refEntity("PROJECT", projectId)
                            .actionUrl("/projects") // User view
                            .icon("bi-calendar-check"));
        }

        return saved;
    }

    @Transactional
    public ProjectAllocation allocateUser(UUID projectId, UUID userId, UUID candidateId, LocalDate startDate,
            LocalDate endDate,
            Integer percentage, String billingRole) {
        log.info("Allocating user {} or candidate {} to project {}", userId, candidateId, projectId);
        try {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));

            Employee employee = null;
            Candidate candidate = null;

            if (userId != null) {
                employee = employeeRepository.findById(userId)
                        .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
            } else if (candidateId != null) {
                candidate = candidateRepository.findById(candidateId)
                        .orElseThrow(() -> new EntityNotFoundException("Candidate not found: " + candidateId));
            } else {
                throw new IllegalArgumentException("Either userId or candidateId must be provided");
            }

            ProjectAllocation allocation = ProjectAllocation.builder()
                    .project(project)
                    .employee(employee)
                    .candidate(candidate)
                    .startDate(startDate)
                    .endDate(endDate)
                    .allocationPercentage(percentage)
                    .billingRole(billingRole)
                    .status(ProjectAllocation.AllocationStatus.ACTIVE)
                    .build();

            ProjectAllocation saved = allocationRepository.save(allocation);
            log.info("User {} allocated successfully to project {}", userId, projectId);

            // Notify User if it's an employee
            if (userId != null) {
                notificationService.sendNotification(
                        NotificationService.NotificationBuilder.create()
                                .recipient(userId)
                                .title("Project Allocation")
                                .body("You have been allocated to project: " + project.getName())
                                .category(
                                        com.solventek.silverwind.notifications.Notification.NotificationCategory.PROJECT)
                                .refEntity("PROJECT", projectId)
                                .actionUrl("/projects")
                                .icon("bi-person-check"));
            }

            timelineService.createEvent(project.getInternalOrg().getId(), "PROJECT", projectId, "ALLOCATE",
                    "User Allocated", getCurrentUserId(), userId != null ? userId : candidateId,
                    "User allocated to project: " + project.getName(),
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

    public Project getById(UUID projectId) {
        log.debug("Fetching project by ID: {}", projectId);
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));
    }

    @Transactional
    public void deleteProject(UUID projectId) {
        log.info("Deleting project: {}", projectId);
        Project project = getById(projectId);
        UUID orgId = project.getInternalOrg().getId();
        String projectName = project.getName();

        projectRepository.delete(project);
        log.info("Project deleted successfully: {}", projectId);

        timelineService.createEvent(orgId, "PROJECT", projectId, "DELETE",
                "Project Deleted", getCurrentUserId(), "Project deleted: " + projectName, null);
    }

    @Transactional
    public void deallocateUser(UUID projectId, UUID allocationId) {
        log.info("Deallocating user from project: {}, allocation: {}", projectId, allocationId);
        ProjectAllocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new EntityNotFoundException("Allocation not found: " + allocationId));

        if (!allocation.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Allocation does not belong to project");
        }

        UUID userId = allocation.getEmployee() != null ? allocation.getEmployee().getId() : null;
        UUID candidateId = allocation.getCandidate() != null ? allocation.getCandidate().getId() : null;
        String projectName = allocation.getProject().getName();
        UUID orgId = allocation.getProject().getInternalOrg().getId();

        allocationRepository.delete(allocation);
        log.info("User deallocated successfully from project: {}", projectId);

        if (userId != null) {
            notificationService.sendNotification(userId, "Project Deallocation",
                    "You have been removed from project: " + projectName, "PROJECT", projectId);
        }

        timelineService.createEvent(orgId, "PROJECT", projectId, "DEALLOCATE",
                "User Deallocated", getCurrentUserId(), userId != null ? userId : candidateId,
                "User removed from project: " + projectName, null);
    }

    private UUID getCurrentUserId() {
        if (SecurityContextHolder.getContext().getAuthentication() != null &&
                SecurityContextHolder.getContext().getAuthentication().getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getId();
        }
        return null;
    }
}
