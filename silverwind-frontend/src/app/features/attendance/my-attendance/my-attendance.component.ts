import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../../core/stores/auth.store';
import { Attendance, TimesheetSummary, AttendanceStatus } from '../models/attendance.model';
import { AttendanceService } from '../services/attendance.service';
import { DialogService } from '../../../core/services/dialog.service';
import { AttendanceBubbleChartComponent } from '../attendance-management/attendance-bubble-chart.component';
import { AttendanceSummaryChartComponent } from '../attendance-management/attendance-summary-chart.component';
import { HeaderService } from '../../../core/services/header.service';

@Component({
  selector: 'app-my-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AttendanceBubbleChartComponent,
    AttendanceSummaryChartComponent,
  ],
  templateUrl: './my-attendance.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyAttendanceComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private headerService = inject(HeaderService);
  private dialogService = inject(DialogService);
  private authStore = inject(AuthStore);

  today = new Date();
  userId = computed(() => this.authStore.user()?.id);

  // State Signals
  attendanceHistory = signal<Attendance[]>([]);
  timesheet = signal<TimesheetSummary | null>(null);
  loading = signal<boolean>(false);
  activeTab = signal<'list' | 'analytics'>('list');

  todayAttendance = signal<Attendance | null>(null);

  // Computed State
  isCheckedIn = computed(() => {
    const attendance = this.todayAttendance();
    return !!attendance?.checkInTime && !attendance?.checkOutTime;
  });

  // Date Filters
  startDate = signal<string>('');
  endDate = signal<string>('');

  ngOnInit() {
    this.headerService.setTitle(
      'My Attendance',
      'View your attendance history and stats',
      'bi bi-clock',
    );
    this.setDefaultDates();
    this.loadTodayStatus();
    this.loadHistory();
  }

  setDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate.set(firstDay.toISOString().split('T')[0]);
    this.endDate.set(today.toISOString().split('T')[0]);
  }

  loadTodayStatus() {
    const uid = this.userId();
    if (!uid) return;

    const todayStr = new Date().toISOString().split('T')[0];
    this.attendanceService.getMyAttendanceByRange(todayStr, todayStr).subscribe({
      next: (data: Attendance[]) => {
        if (data.length > 0) {
          this.todayAttendance.set(data[0]);
        } else {
          this.todayAttendance.set(null);
        }
      },
      error: (err: any) => console.error('Failed to load today status', err),
    });
  }

  loadHistory() {
    const start = this.startDate();
    const end = this.endDate();

    if (!start || !end) return;

    this.loading.set(true);
    this.attendanceService.getMyAttendanceByRange(start, end).subscribe({
      next: (data: Attendance[]) => {
        this.attendanceHistory.set(data);
        this.loading.set(false);
        this.loadTimesheet(); // Also load timesheet summary for same range
      },
      error: (err: any) => {
        console.error('Failed to load history', err);
        this.loading.set(false);
      },
    });
  }

  loadTimesheet() {
    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end) return;

    this.attendanceService.getMyTimesheet(start, end).subscribe({
      next: (data: TimesheetSummary) => {
        this.timesheet.set(data);
      },
      error: (err: any) => console.error('Failed to load timesheet', err),
    });
  }

  checkIn() {
    const uid = this.userId();
    if (!uid) return;

    this.attendanceService.checkInUser(uid).subscribe({
      next: (res: Attendance) => {
        this.todayAttendance.set(res);
        this.loadHistory(); // Refresh list
      },
      error: (err: any) =>
        this.dialogService.open('Error', 'Check-in failed: ' + (err.error?.message || err.message)),
    });
  }

  checkOut() {
    this.attendanceService.checkOut().subscribe({
      next: (res: Attendance) => {
        this.todayAttendance.set(res);
        this.loadHistory(); // Refresh list
      },
      error: (err: any) =>
        this.dialogService.open(
          'Error',
          'Check-out failed: ' + (err.error?.message || err.message),
        ),
    });
  }

  downloadTimesheet() {
    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end) return;

    this.attendanceService.downloadMyTimesheet(start, end).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `timesheet_${start}_${end}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => this.dialogService.open('Error', 'Download failed'),
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800';
      case 'ABSENT':
        return 'bg-red-100 text-red-800';
      case 'HALF_DAY':
        return 'bg-yellow-100 text-yellow-800';
      case 'ON_LEAVE':
        return 'bg-blue-100 text-blue-800';
      case 'WEEKEND':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatTime(timeStr?: string): string {
    if (!timeStr) return '-';
    return timeStr.substring(0, 5);
  }
}
