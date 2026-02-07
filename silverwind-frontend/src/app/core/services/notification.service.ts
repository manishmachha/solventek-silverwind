import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Page } from '../models/page.model';
import { HttpParams, HttpHeaders } from '@angular/common/http';
import { interval } from 'rxjs';

export interface Notification {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  refEntityType: string;
  refEntityId: string;
  actionUrl: string;
  iconType: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationCounts {
  APPLICATION: number;
  JOB: number;
  TICKET: number;
  USER: number;
  ORGANIZATION: number;
  PROJECT: number;
  TRACKING: number;
  SYSTEM: number;
  LEAVE: number;
  ATTENDANCE: number;
  PAYROLL: number;
  ANALYSIS: number;
  ONBOARDING: number;
  INTERVIEW: number;
  ASSET: number;
  HOLIDAY: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private api = inject(ApiService);

  // Centralized signal for notification counts
  readonly notificationCounts = signal<NotificationCounts | null>(null);

  constructor() {
    // Start polling immediately (5 seconds interval for "live" updates)
    this.startPolling();
  }

  private startPolling() {
    // Initial fetch
    this.refreshCounts();

    // Poll every 5 seconds
    interval(5000).subscribe(() => {
      this.refreshCounts();
    });
  }

  refreshCounts() {
    this.getCountByCategory(true).subscribe({
      next: (counts) => this.notificationCounts.set(counts),
      error: () => this.notificationCounts.set(null),
    });
  }

  getNotifications(page: number = 0, size: number = 10, unreadOnly: boolean = false) {
    let params = new HttpParams().set('page', page).set('size', size).set('unreadOnly', unreadOnly);
    return this.api.get<Page<Notification>>('/notifications', params);
  }

  getNotificationsByCategory(category: string, page: number = 0, size: number = 20) {
    let params = new HttpParams().set('page', page).set('size', size);
    return this.api.get<Page<Notification>>(`/notifications/category/${category}`, params);
  }

  getUnreadCount(skipLoading: boolean = false) {
    let headers;
    if (skipLoading) {
      headers = new HttpHeaders().set('X-Skip-Loading', 'true');
    }
    return this.api.get<number>('/notifications/unread-count', undefined, headers);
  }

  getCountByCategory(skipLoading: boolean = false) {
    let headers;
    if (skipLoading) {
      headers = new HttpHeaders().set('X-Skip-Loading', 'true');
    }
    return this.api.get<NotificationCounts>('/notifications/count-by-category', undefined, headers);
  }

  getUnreadEntityIds(category: string) {
    return this.api.get<string[]>(`/notifications/unread-entity-ids/${category}`);
  }

  markAsRead(id: string) {
    return this.api.post<void>(`/notifications/${id}/read`, {});
  }

  markAllAsRead() {
    return this.api.post<number>('/notifications/mark-all-read', {});
  }

  deleteNotification(id: string) {
    return this.api.delete<void>(`/notifications/${id}`);
  }

  deleteAllRead() {
    return this.api.delete<number>('/notifications/read');
  }

  // Helper to get icon class based on category
  getIconClass(notification: Notification): string {
    if (notification.iconType) return notification.iconType;

    switch (notification.category) {
      case 'APPLICATION':
        return 'bi-file-earmark-text-fill';
      case 'JOB':
        return 'bi-briefcase-fill';
      case 'TICKET':
        return 'bi-ticket-detailed-fill';
      case 'USER':
        return 'bi-person-fill';
      case 'ORGANIZATION':
        return 'bi-building-fill';
      case 'PROJECT':
        return 'bi-kanban-fill';
      case 'INTERVIEW':
        return 'bi-calendar-event-fill';
      case 'ONBOARDING':
        return 'bi-person-check-fill';
      case 'ANALYSIS':
        return 'bi-robot';
      case 'TRACKING':
        return 'bi-list-check';
      case 'ASSET':
        return 'bi-laptop';
      case 'HOLIDAY':
        return 'bi-calendar-event-fill';
      case 'LEAVE':
        return 'bi-calendar-x-fill';
      case 'ATTENDANCE':
        return 'bi-calendar-check-fill';
      case 'PAYROLL':
        return 'bi-cash-stack';
      default:
        return 'bi-bell-fill';
    }
  }

  // Helper to get color class based on category
  getColorClass(notification: Notification): { bg: string; text: string } {
    switch (notification.category) {
      case 'APPLICATION':
        return { bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'JOB':
        return { bg: 'bg-purple-100', text: 'text-purple-600' };
      case 'TICKET':
        return { bg: 'bg-amber-100', text: 'text-amber-600' };
      case 'USER':
        return { bg: 'bg-green-100', text: 'text-green-600' };
      case 'ORGANIZATION':
        return { bg: 'bg-indigo-100', text: 'text-indigo-600' };
      case 'PROJECT':
        return { bg: 'bg-pink-100', text: 'text-pink-600' };
      case 'INTERVIEW':
        return { bg: 'bg-cyan-100', text: 'text-cyan-600' };
      case 'ONBOARDING':
        return { bg: 'bg-teal-100', text: 'text-teal-600' };
      case 'ANALYSIS':
        return { bg: 'bg-violet-100', text: 'text-violet-600' };
      case 'TRACKING':
        return { bg: 'bg-fuchsia-100', text: 'text-fuchsia-600' };
      case 'ASSET':
        return { bg: 'bg-emerald-100', text: 'text-emerald-600' };
      case 'HOLIDAY':
        return { bg: 'bg-rose-100', text: 'text-rose-600' };
      case 'LEAVE':
        return { bg: 'bg-rose-100', text: 'text-rose-600' };
      case 'ATTENDANCE':
        return { bg: 'bg-rose-100', text: 'text-rose-600' };
      case 'PAYROLL':
        return { bg: 'bg-rose-100', text: 'text-rose-600' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  }

  // Helper to get priority badge class
  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'NORMAL':
        return 'bg-gray-200 text-gray-700';
      case 'LOW':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  }

  // Helper for relative time
  getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}
