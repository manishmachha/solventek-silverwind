package com.solventek.silverwind.notifications;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.solventek.silverwind.auth.Employee;
import com.solventek.silverwind.auth.EmployeeRepository;
import com.solventek.silverwind.notifications.Notification.NotificationCategory;
import com.solventek.silverwind.notifications.Notification.NotificationPriority;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmployeeRepository employeeRepository;
    private final ObjectMapper objectMapper;

    // ========== RICH NOTIFICATION BUILDER ==========

    /**
     * Send a rich notification with all metadata
     */
    @Transactional
    public Notification sendNotification(NotificationBuilder builder) {
        log.debug("Sending notification of type: {} to user: {}", builder.category, builder.recipientId);
        try {
            Employee recipient = employeeRepository.getReferenceById(builder.recipientId);

            Notification note = Notification.builder()
                    .recipient(recipient)
                    .title(builder.title)
                    .body(builder.body)
                    .category(builder.category != null ? builder.category : NotificationCategory.SYSTEM)
                    .priority(builder.priority != null ? builder.priority : NotificationPriority.NORMAL)
                    .refEntityType(builder.refEntityType)
                    .refEntityId(builder.refEntityId)
                    .actionUrl(builder.actionUrl)
                    .iconType(builder.iconType)
                    .metadata(serializeMetadata(builder.metadata))
                    .build();

            return notificationRepository.save(note);
        } catch (Exception e) {
            log.error("Failed to send notification to {}: {}", builder.recipientId, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Simple notification (backward compatible)
     */
    @Transactional
    public void sendNotification(UUID recipientId, String title, String body, String refType, UUID refId) {
        log.trace("Sending simple notification to {}: {}", recipientId, title);
        sendNotification(NotificationBuilder.create()
                .recipient(recipientId)
                .title(title)
                .body(body)
                .refEntity(refType, refId)
                .category(mapRefTypeToCategory(refType)));
    }

    /**
     * Send notification to all users of an organization
     */
    @Transactional
    public void sendNotificationToOrgAdmins(UUID orgId, String title, String body, String refType, UUID refId) {
        log.debug("Sending notifications to Org Admins of Org ID: {}", orgId);
        java.util.List<Employee> admins = employeeRepository.findByOrganizationId(orgId);
        for (Employee admin : admins) {
            sendNotification(admin.getId(), title, body, refType, refId);
        }
    }

    /**
     * Send rich notification to all users of an organization
     */
    @Transactional
    public void sendNotificationToOrg(UUID orgId, NotificationBuilder builder) {
        log.debug("Sending bulk notification to all users in Org ID: {}", orgId);
        java.util.List<Employee> users = employeeRepository.findByOrganizationId(orgId);
        for (Employee employee : users) {
            sendNotification(builder.recipient(employee.getId()));
        }
    }

    // ========== QUERY METHODS ==========

    public Page<Notification> getMyNotifications(UUID userId, boolean unreadOnly, Pageable pageable) {
        log.debug("Fetching notifications for User ID: {} (UnreadOnly: {})", userId, unreadOnly);
        if (unreadOnly) {
            return notificationRepository.findByRecipientIdAndReadAtIsNullOrderByCreatedAtDesc(userId, pageable);
        }
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable);
    }

    public Page<Notification> getNotificationsByCategory(UUID userId, NotificationCategory category,
            Pageable pageable) {
        log.debug("Fetching notifications for User ID: {} by Category: {}", userId, category);
        return notificationRepository.findByRecipientIdAndCategoryOrderByCreatedAtDesc(userId, category, pageable);
    }

    public long getUnreadCount(UUID userId) {
        log.trace("Counting unread notifications for User ID: {}", userId);
        return notificationRepository.countUnread(userId);
    }

    public java.util.List<UUID> getUnreadEntityIds(UUID userId, NotificationCategory category) {
        log.trace("Getting unread entity IDs for User ID: {} and Category: {}", userId, category);
        return notificationRepository.findUnreadEntityIds(userId, category);
    }

    public Map<String, Long> getUnreadCountByCategory(UUID userId) {
        log.trace("Getting unread count by category for User ID: {}", userId);
        return Map.ofEntries(
                Map.entry("APPLICATION",
                        notificationRepository.countUnreadByCategory(userId, NotificationCategory.APPLICATION)),
                Map.entry("JOB", notificationRepository.countUnreadByCategory(userId, NotificationCategory.JOB)),
                Map.entry("TICKET", notificationRepository.countUnreadByCategory(userId, NotificationCategory.TICKET)),
                Map.entry("USER", notificationRepository.countUnreadByCategory(userId, NotificationCategory.USER)),
                Map.entry("ORGANIZATION",
                        notificationRepository.countUnreadByCategory(userId, NotificationCategory.ORGANIZATION)),
                Map.entry("PROJECT",
                        notificationRepository.countUnreadByCategory(userId, NotificationCategory.PROJECT)),
                Map.entry("TRACKING",
                        notificationRepository.countUnreadByCategory(userId, NotificationCategory.TRACKING)),
                Map.entry("ANALYSIS",
                        notificationRepository.countUnreadByCategory(userId, NotificationCategory.ANALYSIS)),
                Map.entry("ONBOARDING",
                        notificationRepository.countUnreadByCategory(userId, NotificationCategory.ONBOARDING)),
                Map.entry("LEAVE", notificationRepository.countUnreadByCategory(userId, NotificationCategory.LEAVE)),
                Map.entry("ATTENDANCE",
                        notificationRepository.countUnreadByCategory(userId, NotificationCategory.ATTENDANCE)),
                Map.entry("PAYROLL",
                        notificationRepository.countUnreadByCategory(userId, NotificationCategory.PAYROLL)),
                Map.entry("SYSTEM", notificationRepository.countUnreadByCategory(userId, NotificationCategory.SYSTEM)),
                Map.entry("INTERVIEW",
                        notificationRepository.countUnreadByCategory(userId, NotificationCategory.INTERVIEW)),
                Map.entry("ASSET", notificationRepository.countUnreadByCategory(userId, NotificationCategory.ASSET)),
                Map.entry("HOLIDAY",
                        notificationRepository.countUnreadByCategory(userId, NotificationCategory.HOLIDAY)));
    }

    // ========== ACTIONS ==========

    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        log.debug("Marking Notification ID: {} as read by User: {}", notificationId, userId);
        try {
            Notification n = notificationRepository.findById(notificationId)
                    .orElseThrow(() -> new EntityNotFoundException("Notification not found"));

            if (!n.getRecipient().getId().equals(userId)) {
                log.warn("User {} attempted to mark notification {} as read, but is not the recipient", userId,
                        notificationId);
                throw new EntityNotFoundException("Notification not found for user");
            }

            n.setReadAt(LocalDateTime.now());
            notificationRepository.save(n);
        } catch (Exception e) {
            log.error("Error marking notification {} as read for user {}: {}", notificationId, userId, e.getMessage(),
                    e);
            throw e;
        }
    }

    @Transactional
    public int markAllAsRead(UUID userId) {
        log.info("Marking ALL notifications as read for User ID: {}", userId);
        return notificationRepository.markAllAsRead(userId, LocalDateTime.now());
    }

    @Transactional
    public void deleteNotification(UUID notificationId, UUID userId) {
        log.info("Deleting Notification ID: {} by User: {}", notificationId, userId);
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found"));

        if (!n.getRecipient().getId().equals(userId)) {
            throw new EntityNotFoundException("Notification not found for user");
        }

        notificationRepository.delete(n);
    }

    @Transactional
    public int deleteAllRead(UUID userId) {
        log.info("Deleting all read notifications for User ID: {}", userId);
        return notificationRepository.deleteAllReadByUserId(userId);
    }

    // ========== HELPERS ==========

    private NotificationCategory mapRefTypeToCategory(String refType) {
        log.trace("Mapping refType: {}", refType);
        if (refType == null)
            return NotificationCategory.SYSTEM;
        return switch (refType.toUpperCase()) {
            case "APPLICATION" -> NotificationCategory.APPLICATION;
            case "JOB" -> NotificationCategory.JOB;
            case "TICKET" -> NotificationCategory.TICKET;
            case "USER" -> NotificationCategory.USER;
            case "ORGANIZATION" -> NotificationCategory.ORGANIZATION;
            case "PROJECT" -> NotificationCategory.PROJECT;
            case "INTERVIEW" -> NotificationCategory.INTERVIEW;
            case "ONBOARDING" -> NotificationCategory.ONBOARDING;
            case "LEAVE" -> NotificationCategory.LEAVE;
            case "ATTENDANCE" -> NotificationCategory.ATTENDANCE;
            case "PAYROLL" -> NotificationCategory.PAYROLL;
            default -> NotificationCategory.SYSTEM;
        };
    }

    private String serializeMetadata(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty())
            return null;
        log.trace("Serializing metadata of size: {}", metadata.size());
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize notification metadata", e);
            return null;
        }
    }

    // ========== BUILDER CLASS ==========

    public static class NotificationBuilder {
        UUID recipientId;
        String title;
        String body;
        NotificationCategory category;
        NotificationPriority priority;
        String refEntityType;
        UUID refEntityId;
        String actionUrl;
        String iconType;
        Map<String, Object> metadata;

        public static NotificationBuilder create() {
            return new NotificationBuilder();
        }

        public NotificationBuilder recipient(UUID recipientId) {
            this.recipientId = recipientId;
            return this;
        }

        public NotificationBuilder title(String title) {
            this.title = title;
            return this;
        }

        public NotificationBuilder body(String body) {
            this.body = body;
            return this;
        }

        public NotificationBuilder category(NotificationCategory category) {
            this.category = category;
            return this;
        }

        public NotificationBuilder priority(NotificationPriority priority) {
            this.priority = priority;
            return this;
        }

        public NotificationBuilder refEntity(String type, UUID id) {
            this.refEntityType = type;
            this.refEntityId = id;
            return this;
        }

        public NotificationBuilder actionUrl(String url) {
            this.actionUrl = url;
            return this;
        }

        public NotificationBuilder icon(String iconType) {
            this.iconType = iconType;
            return this;
        }

        public NotificationBuilder metadata(Map<String, Object> metadata) {
            this.metadata = metadata;
            return this;
        }

        public NotificationBuilder withMetadata(String key, Object value) {
            if (this.metadata == null) {
                this.metadata = new java.util.HashMap<>();
            }
            this.metadata.put(key, value);
            return this;
        }
    }
}
