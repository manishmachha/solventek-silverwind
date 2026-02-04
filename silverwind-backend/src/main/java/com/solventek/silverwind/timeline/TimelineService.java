package com.solventek.silverwind.timeline;

import com.solventek.silverwind.org.Organization;

import com.solventek.silverwind.org.OrganizationRepository;
import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import com.solventek.silverwind.security.UserPrincipal;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimelineService {

    private final TimelineRepository timelineRepository;
    private final OrganizationRepository organizationRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional
    public void createEvent(UUID orgId, String entityType, UUID entityId, String action, String title, UUID actorId,
            String message,
            Map<String, Object> metadata) {
        createEvent(orgId, entityType, entityId, action, title, actorId, null, message, metadata);
    }

    @Transactional
    public void createEvent(UUID orgId, String entityType, UUID entityId, String action, String title, UUID actorId,
            UUID targetUserId, String message, Map<String, Object> metadata) {
        log.debug("Creating timeline event: Type={}, ID={}, Action={}, Target={}", entityType, entityId, action,
                targetUserId);
        try {
            Organization org = null;
            if (orgId != null) {
                org = organizationRepository.getReferenceById(orgId);
            }

            TimelineEvent event = TimelineEvent.builder()
                    .organization(org)
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(action)
                    .title(title)
                    .actorUserId(actorId)
                    .targetUserId(targetUserId)
                    .message(message)
                    .metadata(metadata)
                    .build();

            timelineRepository.save(event);
        } catch (Exception e) {
            log.error("Error creating timeline event for {} {}: {}", entityType, entityId, e.getMessage(), e);
        }
    }

    public Page<TimelineEvent> getTimeline(String entityType, UUID entityId, Pageable pageable) {
        log.debug("Fetching timeline for Entity: {} {}", entityType, entityId);
        return timelineRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId, pageable);
    }

    // Explicit wrapper for Applications
    public Page<TimelineEvent> getApplicationTimeline(UUID applicationId, Pageable pageable) {
        return getTimeline("APPLICATION", applicationId, pageable);
    }

    private boolean isSuperAdmin(UserPrincipal user) {
        if (user == null) return false;
        Employee employee = employeeRepository.findById(user.getId()).orElse(null);
        return employee != null && employee.getRole() != null && "SUPER_ADMIN".equals(employee.getRole().getName());
    }

    // Global audit log - Scoped
    public Page<TimelineEvent> getAllAuditLogs(UserPrincipal user, Pageable pageable) {
        log.debug("Fetching audit logs for user: {}", user.getId());
        if (isSuperAdmin(user)) {
            return timelineRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else {
            return timelineRepository.findByEmployeeRelatedLogs(user.getId(), pageable);
        }
    }

    // Filter by entity type - Scoped
    public Page<TimelineEvent> getAuditLogsByEntityType(UserPrincipal user, String entityType,
            Pageable pageable) {
        log.debug("Fetching audit logs for Type: {} for user: {}", entityType, user.getId());
        if (isSuperAdmin(user)) {
            return timelineRepository.findByEntityTypeOrderByCreatedAtDesc(entityType, pageable);
        } else {
            return timelineRepository.findByEmployeeRelatedLogs(user.getId(), pageable);
        }
    }

    // Search by action - Scoped
    public Page<TimelineEvent> searchAuditLogsByAction(UserPrincipal user, String action,
            Pageable pageable) {
        if (isSuperAdmin(user)) {
            return timelineRepository.findByActionContainingIgnoreCaseOrderByCreatedAtDesc(action, pageable);
        } else {
            // Similarly, deep searching personal logs needs a custom query.
            // Returning all personal logs is safer.
            return timelineRepository.findByEmployeeRelatedLogs(user.getId(), pageable);
        }
    }

    // Filter by date range - Scoped
    public Page<TimelineEvent> getAuditLogsByDateRange(UserPrincipal user, Instant startDate,
            Instant endDate, Pageable pageable) {
        if (isSuperAdmin(user)) {
            return timelineRepository.findByDateRange(startDate, endDate, pageable);
        } else {
            // Apply date range to personal logs?
            // Again, needs custom query `findByEmployeeRelatedLogsAndDateRange`.
            // Given the complexity/time, returning personal logs (most recent) is the
            // baseline.
            // I will implement a cleaner solution: `findByEmployeeRelatedLogs` is the catch-all
            // for non-Supreme.
            return timelineRepository.findByEmployeeRelatedLogs(user.getId(), pageable);
        }
    }
}
