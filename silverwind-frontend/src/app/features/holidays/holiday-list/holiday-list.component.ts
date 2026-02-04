import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HolidayService } from '../../../core/services/holiday.service';
import { Holiday } from '../../../core/models/holiday.model';
import { AuthStore } from '../../../core/stores/auth.store';
import { NotificationService } from '../../../core/services/notification.service';
import { HeaderService } from '../../../core/services/header.service';

@Component({
  selector: 'app-holiday-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './holiday-list.component.html',
})
export class HolidayListComponent implements OnInit {
  private holidayService = inject(HolidayService);
  private headerService = inject(HeaderService);
  authStore = inject(AuthStore);
  private notificationService = inject(NotificationService);

  holidays = signal<Holiday[]>([]);
  unreadHolidayIds = new Set<string>();
  isLoading = signal<boolean>(true);
  showModal = signal<boolean>(false);

  // Form State
  newHoliday: Partial<Holiday> = {
    mandatory: true,
  };
  isSaving = false;

  ngOnInit() {
    this.headerService.setTitle(
      'Holiday Calendar',
      'Organization holidays and events',
      'bi bi-calendar-event',
    );
    this.loadUnreadHolidayIds();
    this.loadHolidays();
  }

  loadUnreadHolidayIds() {
    this.notificationService.getUnreadEntityIds('HOLIDAY').subscribe({
      next: (ids) => (this.unreadHolidayIds = new Set(ids)),
      error: () => (this.unreadHolidayIds = new Set()),
    });
  }

  hasNotification(holidayId: string): boolean {
    return this.unreadHolidayIds.has(holidayId);
  }

  loadHolidays() {
    this.isLoading.set(true);
    this.holidayService.getHolidays().subscribe({
      next: (data) => {
        // Sort: notified first, then by date desc
        const sorted = data.sort((a, b) => {
          const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
          const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
          if (bHasNotif !== aHasNotif) return bHasNotif - aHasNotif;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        this.holidays.set(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load holidays', err);
        this.isLoading.set(false);
      },
    });
  }

  canManage(): boolean {
    const role = this.authStore.userRole();
    return role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  }

  openAddHolidayModal() {
    this.newHoliday = { mandatory: true };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  isValid(): boolean {
    return !!this.newHoliday.name && !!this.newHoliday.date;
  }

  saveHoliday() {
    if (!this.isValid()) return;

    this.isSaving = true;
    this.holidayService.addHoliday(this.newHoliday).subscribe({
      next: (holiday) => {
        this.holidays.update((current) =>
          [holiday, ...current].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
        );
        this.isSaving = false;
        this.closeModal();
      },
      error: (err) => {
        console.error('Failed to add holiday', err);
        // Ideally show toast
        this.isSaving = false;
      },
    });
  }

  deleteHoliday(holiday: Holiday) {
    if (!confirm(`Are you sure you want to delete "${holiday.name}"?`)) return;

    this.holidayService.deleteHoliday(holiday.id).subscribe({
      next: () => {
        this.holidays.update((current) => current.filter((h) => h.id !== holiday.id));
      },
      error: (err) => {
        console.error('Failed to delete holiday', err);
      },
    });
  }

  // Date Helpers
  getMonth(dateStr: string): string {
    return new Date(dateStr).toLocaleString('default', { month: 'short' });
  }

  getDay(dateStr: string): string {
    return new Date(dateStr).getDate().toString();
  }
}
