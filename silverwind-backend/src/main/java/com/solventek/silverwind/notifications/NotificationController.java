package com.solventek.silverwind.notifications;

import com.solventek.silverwind.common.ApiResponse;
import com.solventek.silverwind.notifications.Notification.NotificationCategory;
import com.solventek.silverwind.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Notification management controller.
 * All authenticated users can access their notifications.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR')")
    public ResponseEntity<ApiResponse<Page<Notification>>> getNotifications(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false, defaultValue = "false") boolean unreadOnly,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getMyNotifications(currentUser.getId(), unreadOnly, pageable)));
    }

    @GetMapping("/category/{category}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR')")
    public ResponseEntity<ApiResponse<Page<Notification>>> getByCategory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String category,
            Pageable pageable) {
        NotificationCategory cat = NotificationCategory.valueOf(category.toUpperCase());
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getNotificationsByCategory(currentUser.getId(), cat, pageable)));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR')")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadCount(currentUser.getId())));
    }

    @GetMapping("/count-by-category")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getCountByCategory(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getUnreadCountByCategory(currentUser.getId())));
    }

    @GetMapping("/unread-entity-ids/{category}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR')")
    public ResponseEntity<ApiResponse<List<UUID>>> getUnreadEntityIds(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable String category) {
        NotificationCategory cat = NotificationCategory.valueOf(category.toUpperCase());
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getUnreadEntityIds(currentUser.getId(), cat)));
    }

    @PostMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR')")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        notificationService.markAsRead(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/mark-all-read")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR')")
    public ResponseEntity<ApiResponse<Integer>> markAllRead(@AuthenticationPrincipal UserPrincipal currentUser) {
        int count = notificationService.markAllAsRead(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR')")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        notificationService.deleteNotification(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/read")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN', 'TA', 'EMPLOYEE', 'VENDOR')")
    public ResponseEntity<ApiResponse<Integer>> deleteAllRead(@AuthenticationPrincipal UserPrincipal currentUser) {
        int count = notificationService.deleteAllRead(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}
