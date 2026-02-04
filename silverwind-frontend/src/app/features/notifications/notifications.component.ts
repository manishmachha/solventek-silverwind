import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { HeaderService } from '../../core/services/header.service';

interface GroupedNotifications {
  label: string;
  notifications: Notification[];
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="md:p-8 p-4 max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div></div>
        <div class="flex gap-3">
          <button
            *ngIf="unreadCount() > 0"
            (click)="markAllAsRead()"
            class="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <i class="bi bi-check2-all mr-2"></i>Mark all as read
          </button>
          <button
            *ngIf="hasReadNotifications"
            (click)="deleteAllRead()"
            class="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
          >
            <i class="bi bi-trash3 mr-2"></i>Clear read
          </button>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="card-modern overflow-hidden">
        <div class="flex border-b border-gray-100 bg-gray-50/50">
          <button
            *ngFor="let filter of filters"
            (click)="activeFilter = filter.value; loadNotifications()"
            [class.border-indigo-500]="activeFilter === filter.value"
            [class.text-indigo-600]="activeFilter === filter.value"
            [class.border-transparent]="activeFilter !== filter.value"
            [class.text-gray-500]="activeFilter !== filter.value"
            class="flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors hover:text-indigo-600"
          >
            {{ filter.label }}
            <span
              *ngIf="filter.value === 'unread' && unreadCount() > 0"
              class="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-600 rounded-full"
            >
              {{ unreadCount() }}
            </span>
          </button>
        </div>

        <!-- Notifications List -->
        <div class="divide-y divide-gray-50">
          <ng-container *ngFor="let group of groupedNotifications()">
            <div class="px-5 py-2 bg-gray-50 border-b border-gray-100">
              <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {{ group.label }}
              </span>
            </div>

            <div
              *ngFor="let notification of group.notifications"
              (click)="handleClick(notification)"
              class="px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              [class.bg-indigo-50/50]="!notification.read"
            >
              <div class="flex items-start gap-4">
                <!-- Icon -->
                <div
                  class="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  [ngClass]="getColorClasses(notification)"
                >
                  <i [class]="'bi ' + getIcon(notification) + ' text-lg'"></i>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="text-sm font-semibold text-gray-900">{{ notification.title }}</p>
                      <p class="text-sm text-gray-600 mt-0.5 line-clamp-2">
                        {{ notification.body }}
                      </p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span
                        *ngIf="
                          notification.priority === 'URGENT' || notification.priority === 'HIGH'
                        "
                        [class]="
                          'px-2 py-0.5 text-[10px] font-bold rounded-full ' +
                          getPriorityClass(notification.priority)
                        "
                      >
                        {{ notification.priority }}
                      </span>
                      <span class="text-xs text-gray-400 whitespace-nowrap">
                        {{ getRelativeTime(notification.createdAt) }}
                      </span>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center gap-3 mt-2">
                    <span
                      class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
                    >
                      {{ notification.category }}
                    </span>
                    <button
                      *ngIf="!notification.read"
                      (click)="markAsRead(notification, $event)"
                      class="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Mark as read
                    </button>
                    <button
                      (click)="deleteNotification(notification, $event)"
                      class="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <!-- Unread Dot -->
                <div
                  *ngIf="!notification.read"
                  class="shrink-0 w-2.5 h-2.5 rounded-full bg-indigo-500 mt-2"
                ></div>
              </div>
            </div>
          </ng-container>

          <!-- Empty State -->
          <div *ngIf="notifications().length === 0" class="py-16 text-center">
            <div
              class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <i class="bi bi-bell-slash text-2xl text-gray-400"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">No notifications</h3>
            <p class="text-sm text-gray-500 mt-1">
              {{
                activeFilter === 'unread'
                  ? "You're all caught up!"
                  : 'Your notification history will appear here'
              }}
            </p>
          </div>
        </div>

        <!-- Load More -->
        <div *ngIf="hasMore" class="p-4 border-t border-gray-100 text-center">
          <button
            (click)="loadMore()"
            [disabled]="isLoading()"
            class="px-6 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {{ isLoading() ? 'Loading...' : 'Load more' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private headerService = inject(HeaderService);

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  isLoading = signal(false);

  activeFilter: 'all' | 'unread' = 'all';
  filters = [
    { label: 'All', value: 'all' as const },
    { label: 'Unread', value: 'unread' as const },
  ];

  currentPage = 0;
  pageSize = 20;
  hasMore = false;
  hasReadNotifications = false;

  ngOnInit() {
    this.headerService.setTitle(
      'Notifications',
      'Stay updated on all your activities',
      'bi bi-bell',
    );
    this.loadNotifications();
    this.loadUnreadCount();
  }

  loadNotifications() {
    this.isLoading.set(true);
    this.currentPage = 0;
    const unreadOnly = this.activeFilter === 'unread';

    this.notificationService
      .getNotifications(this.currentPage, this.pageSize, unreadOnly)
      .subscribe({
        next: (page) => {
          const mapped = page.content.map((n: any) => ({
            ...n,
            read: n.readAt != null,
          }));
          this.notifications.set(mapped);
          this.hasMore = !page.last;
          this.hasReadNotifications = mapped.some((n) => n.read);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  loadMore() {
    this.isLoading.set(true);
    this.currentPage++;
    const unreadOnly = this.activeFilter === 'unread';

    this.notificationService
      .getNotifications(this.currentPage, this.pageSize, unreadOnly)
      .subscribe({
        next: (page) => {
          const mapped = page.content.map((n: any) => ({
            ...n,
            read: n.readAt != null,
          }));
          this.notifications.update((current) => [...current, ...mapped]);
          this.hasMore = !page.last;
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  loadUnreadCount() {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => this.unreadCount.set(count),
    });
  }

  groupedNotifications(): GroupedNotifications[] {
    const groups: Map<string, Notification[]> = new Map();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);

    for (const n of this.notifications()) {
      const date = new Date(n.createdAt);
      let label: string;

      if (date >= today) {
        label = 'Today';
      } else if (date >= yesterday) {
        label = 'Yesterday';
      } else if (date >= weekAgo) {
        label = 'This Week';
      } else {
        label = 'Older';
      }

      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(n);
    }

    const order = ['Today', 'Yesterday', 'This Week', 'Older'];
    return order
      .filter((label) => groups.has(label))
      .map((label) => ({ label, notifications: groups.get(label)! }));
  }

  handleClick(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe(() => {
        this.loadUnreadCount();
        notification.read = true;
      });
    }
    // Navigate if actionUrl is set
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  }

  markAsRead(notification: Notification, event: Event) {
    event.stopPropagation();
    this.notificationService.markAsRead(notification.id).subscribe(() => {
      notification.read = true;
      this.loadUnreadCount();
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
      this.unreadCount.set(0);
    });
  }

  deleteNotification(notification: Notification, event: Event) {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification.id).subscribe(() => {
      this.notifications.update((list) => list.filter((n) => n.id !== notification.id));
      if (!notification.read) {
        this.loadUnreadCount();
      }
    });
  }

  deleteAllRead() {
    this.notificationService.deleteAllRead().subscribe(() => {
      this.notifications.update((list) => list.filter((n) => !n.read));
      this.hasReadNotifications = false;
    });
  }

  getIcon(n: Notification): string {
    return this.notificationService.getIconClass(n);
  }

  getColorClasses(n: Notification): string {
    const colors = this.notificationService.getColorClass(n);
    return `${colors.bg} ${colors.text}`;
  }

  getPriorityClass(priority: string): string {
    return this.notificationService.getPriorityClass(priority);
  }

  getRelativeTime(dateStr: string): string {
    return this.notificationService.getRelativeTime(dateStr);
  }
}
