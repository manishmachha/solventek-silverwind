package com.solventek.silverwind.notifications;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    @JsonIgnore
    private Employee recipient;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String body;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    // ========== ENHANCED FIELDS ==========

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    @Builder.Default
    private NotificationCategory category = NotificationCategory.SYSTEM;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    @Builder.Default
    private NotificationPriority priority = NotificationPriority.NORMAL;

    @Column(name = "ref_entity_type")
    private String refEntityType;

    @Column(name = "ref_entity_id")
    private UUID refEntityId;

    @Column(name = "action_url")
    private String actionUrl; // Deep link path e.g., "/applications/uuid"

    @Column(name = "icon_type")
    private String iconType; // Frontend icon hint e.g., "bi-person-check"

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON for extra context

    // ========== ENUMS ==========

    public enum NotificationCategory {
        APPLICATION, // Application submissions, status changes
        JOB, // Job postings, updates
        TICKET, // Support tickets
        USER, // User invites, role changes
        ORGANIZATION, // Org updates
        PROJECT, // Project updates
        INTERVIEW, // Interview scheduling
        ONBOARDING, // Onboarding tasks
        ANALYSIS, // AI analysis complete
        TRACKING, // Application status tracking updates
        LEAVE, // Leave requests and approvals
        ATTENDANCE, // Attendance updates
        PAYROLL, // Payslips and payments
        ASSET, // Asset management
        HOLIDAY, // Holiday updates
        SYSTEM // General system notifications
    }

    public enum NotificationPriority {
        LOW,
        NORMAL,
        HIGH,
        URGENT
    }

    // Helper method to check if read
    public boolean isRead() {
        return readAt != null;
    }
}
