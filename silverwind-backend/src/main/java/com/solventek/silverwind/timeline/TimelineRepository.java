package com.solventek.silverwind.timeline;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.UUID;

public interface TimelineRepository extends JpaRepository<TimelineEvent, UUID> {
        Page<TimelineEvent> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, UUID entityId,
                        Pageable pageable);

        // Global audit log - all events ordered by date
        Page<TimelineEvent> findAllByOrderByCreatedAtDesc(Pageable pageable);

        // Filter by entity type
        Page<TimelineEvent> findByEntityTypeOrderByCreatedAtDesc(String entityType, Pageable pageable);

        // Search by action
        Page<TimelineEvent> findByActionContainingIgnoreCaseOrderByCreatedAtDesc(String action, Pageable pageable);

        // Filter by date range
        @Query("SELECT t FROM TimelineEvent t WHERE t.createdAt BETWEEN :startDate AND :endDate ORDER BY t.createdAt DESC")
        Page<TimelineEvent> findByDateRange(@Param("startDate") Instant startDate, @Param("endDate") Instant endDate,
                        Pageable pageable);

        // Filter by Organization
        Page<TimelineEvent> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId, Pageable pageable);

        Page<TimelineEvent> findByOrganizationIdAndEntityTypeOrderByCreatedAtDesc(UUID organizationId,
                        String entityType, Pageable pageable);

        Page<TimelineEvent> findByOrganizationIdAndActionContainingIgnoreCaseOrderByCreatedAtDesc(UUID organizationId,
                        String action, Pageable pageable);

        @Query("SELECT t FROM TimelineEvent t WHERE t.organization.id = :organizationId AND t.createdAt BETWEEN :startDate AND :endDate ORDER BY t.createdAt DESC")
        Page<TimelineEvent> findByOrganizationIdAndDateRange(@Param("organizationId") UUID organizationId,
                        @Param("startDate") Instant startDate, @Param("endDate") Instant endDate, Pageable pageable);

        // Filter by User (Personal Logs - Actor, Target, or Subject Entity)
        @Query("SELECT t FROM TimelineEvent t WHERE (t.actorUserId = :userId OR t.targetUserId = :userId OR (t.entityType = 'USER' AND t.entityId = :userId)) ORDER BY t.createdAt DESC")
        Page<TimelineEvent> findByEmployeeRelatedLogs(@Param("userId") UUID userId, Pageable pageable);
}
