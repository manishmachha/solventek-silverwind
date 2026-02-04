package com.solventek.silverwind.notifications;

import com.solventek.silverwind.notifications.Notification.NotificationCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

    Page<Notification> findByRecipientIdAndReadAtIsNullOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

    Page<Notification> findByRecipientIdAndCategoryOrderByCreatedAtDesc(UUID recipientId, NotificationCategory category,
            Pageable pageable);

    @Query("SELECT DISTINCT n.refEntityId FROM Notification n WHERE n.recipient.id = :userId AND n.readAt IS NULL AND n.category = :category")
    List<UUID> findUnreadEntityIds(@Param("userId") UUID userId, @Param("category") NotificationCategory category);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipient.id = :userId AND n.readAt IS NULL")
    long countUnread(@Param("userId") UUID userId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipient.id = :userId AND n.readAt IS NULL AND n.category = :category")
    long countUnreadByCategory(@Param("userId") UUID userId, @Param("category") NotificationCategory category);

    @Modifying
    @Query("UPDATE Notification n SET n.readAt = :readAt WHERE n.recipient.id = :userId AND n.readAt IS NULL")
    int markAllAsRead(@Param("userId") UUID userId, @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.recipient.id = :userId AND n.readAt IS NOT NULL")
    int deleteAllReadByUserId(@Param("userId") UUID userId);
}
