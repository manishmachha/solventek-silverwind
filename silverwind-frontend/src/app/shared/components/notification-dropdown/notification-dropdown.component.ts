import {
  Component,
  inject,
  OnInit,
  signal,
  HostListener,
  ElementRef,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { interval, switchMap } from 'rxjs';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <!-- Bell Icon Button -->
      <button
        (click)="toggleDropdown()"
        class="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <i class="bi bi-bell text-xl"></i>
        <!-- Unread Badge -->
        <span
          *ngIf="unreadCount() > 0"
          class="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full transform translate-x-1 -translate-y-1 animate-pulse"
        >
          {{ unreadCount() > 99 ? '99+' : unreadCount() }}
        </span>
      </button>

      <!-- Dropdown Menu -->
      <div
        *ngIf="isOpen()"
        class="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
      >
        <!-- Header -->
        <div
          class="px-5 py-4 bg-linear-to-r from-indigo-50 to-purple-50 border-b border-gray-100 flex justify-between items-center"
        >
          <div>
            <h3 class="font-bold text-gray-900">Notifications</h3>
            <p class="text-xs text-gray-500 mt-0.5">{{ unreadCount() }} unread</p>
          </div>
          <button
            *ngIf="unreadCount() > 0"
            (click)="markAllRead()"
            class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-3 py-1.5 bg-white rounded-lg shadow-sm hover:shadow transition-all"
          >
            Mark all read
          </button>
        </div>

        <!-- Notifications List -->
        <div class="max-h-[400px] overflow-y-auto">
          <div
            *ngFor="let notification of notifications(); let i = index"
            (click)="handleClick(notification)"
            class="px-5 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-all duration-200"
            [class.bg-indigo-50/50]="!notification.read"
          >
            <div class="flex items-start gap-4">
              <!-- Icon -->
              <div
                class="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                [ngClass]="getColorClasses(notification)"
              >
                <i [class]="'bi ' + getIcon(notification) + ' text-lg'"></i>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <p class="text-sm font-semibold text-gray-900 leading-tight">
                    {{ notification.title }}
                  </p>
                  <span class="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                    {{ getRelativeTime(notification.createdAt) }}
                  </span>
                </div>
                <p class="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                  {{ notification.body }}
                </p>
                <!-- Category Badge -->
                <div class="flex items-center gap-2 mt-2">
                  <span
                    class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wider"
                  >
                    {{ notification.category }}
                  </span>
                  <span
                    *ngIf="notification.priority === 'URGENT' || notification.priority === 'HIGH'"
                    [class]="
                      'text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ' +
                      getPriorityClass(notification.priority)
                    "
                  >
                    {{ notification.priority }}
                  </span>
                </div>
              </div>

              <!-- Unread Dot -->
              <div
                *ngIf="!notification.read"
                class="shrink-0 w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5 animate-pulse"
              ></div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="notifications().length === 0" class="py-12 text-center">
            <div
              class="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <i class="bi bi-bell-slash text-xl text-gray-400"></i>
            </div>
            <p class="text-sm font-medium text-gray-600">No notifications</p>
            <p class="text-xs text-gray-400 mt-1">You're all caught up!</p>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="px-5 py-3 bg-linear-to-r from-gray-50 to-white border-t border-gray-100 text-center"
        >
          <button
            (click)="viewAll()"
            class="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center justify-center gap-2 w-full py-1 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            View all notifications
            <i class="bi bi-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class NotificationDropdownComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private elementRef = inject(ElementRef);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  isOpen = signal(false);

  ngOnInit() {
    this.loadUnreadCount();

    // Poll every 10 seconds
    interval(5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadUnreadCount();
        if (this.isOpen()) {
          this.loadNotifications();
        }
      });
  }

  loadUnreadCount() {
    this.notificationService.getUnreadCount(true).subscribe({
      next: (count) => this.unreadCount.set(count),
      error: () => this.unreadCount.set(0),
    });
  }

  loadNotifications() {
    this.notificationService.getNotifications(0, 10, false, true).subscribe({
      next: (page) => {
        this.notifications.set(
          page.content.map((n: any) => ({
            ...n,
            read: n.readAt != null,
          })),
        );
      },
    });
  }

  toggleDropdown() {
    this.isOpen.update((open) => !open);
    if (this.isOpen()) {
      this.loadNotifications();
    }
  }

  handleClick(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id, true).subscribe(() => {
        this.loadUnreadCount();
        notification.read = true;
      });
    }
    // Navigate if actionUrl is set
    if (notification.actionUrl) {
      this.isOpen.set(false);
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  markAllRead() {
    this.notificationService.markAllAsRead(true).subscribe({
      next: () => {
        this.loadNotifications();
        this.loadUnreadCount();
      },
    });
  }

  viewAll() {
    this.isOpen.set(false);
    this.router.navigate(['/notifications']);
  }

  getIcon(notification: Notification): string {
    return this.notificationService.getIconClass(notification);
  }

  getColorClasses(notification: Notification): string {
    const colors = this.notificationService.getColorClass(notification);
    return `${colors.bg} ${colors.text}`;
  }

  getPriorityClass(priority: string): string {
    return this.notificationService.getPriorityClass(priority);
  }

  getRelativeTime(dateStr: string): string {
    return this.notificationService.getRelativeTime(dateStr);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
