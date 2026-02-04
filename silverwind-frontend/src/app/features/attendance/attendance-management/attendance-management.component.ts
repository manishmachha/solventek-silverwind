import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { Attendance, TimesheetSummary, AttendanceStatus } from '../models/attendance.model';
import { User } from '../../../core/models/auth.model';
import { AttendanceService } from '../services/attendance.service';
import { DialogService } from '../../../core/services/dialog.service';
import { AttendanceBubbleChartComponent } from './attendance-bubble-chart.component';
import { AttendanceSummaryChartComponent } from './attendance-summary-chart.component';
import { NotificationService } from '../../../core/services/notification.service';
import { HeaderService } from '../../../core/services/header.service';
import { MarkAttendanceModalComponent } from '../components/mark-attendance-modal/mark-attendance-modal.component';

@Component({
  selector: 'app-attendance-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AttendanceBubbleChartComponent,
    AttendanceSummaryChartComponent,
    MarkAttendanceModalComponent,
  ],
  templateUrl: './attendance-management.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceManagementComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private headerService = inject(HeaderService);
  private dialogService = inject(DialogService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

  today = new Date();

  // Data Signals
  employees = signal<User[]>([]);
  attendanceRecords = signal<Attendance[]>([]);
  unreadAttendanceIds = new Set<string>();
  selectedEmployeeTimesheet = signal<TimesheetSummary | null>(null);

  // Filter Signals
  selectedDate = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');
  selectedEmployeeId = signal<string>('');

  // UI State
  showMarkModal = signal<boolean>(false);
  activeTab = signal<'daily' | 'timesheet'>('daily');

  ngOnInit() {
    this.headerService.setTitle(
      'Attendance Management',
      'Monitor employee check-ins and timesheets',
      'bi bi-calendar-check',
    );
    this.loadUnreadAttendanceIds();
    this.setDefaultDates();
    this.loadEmployees();
    this.loadDailyAttendance();
  }

  loadUnreadAttendanceIds() {
    this.notificationService.getUnreadEntityIds('ATTENDANCE').subscribe({
      next: (ids) => (this.unreadAttendanceIds = new Set(ids)),
      error: () => (this.unreadAttendanceIds = new Set()),
    });
  }

  hasNotification(attendanceId: string): boolean {
    return this.unreadAttendanceIds.has(attendanceId);
  }

  setDefaultDates() {
    const today = new Date();
    const sDate = today.toISOString().split('T')[0];
    this.selectedDate.set(sDate);

    // Month range for timesheet
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate.set(firstDay.toISOString().split('T')[0]);
    this.endDate.set(sDate);
  }

  loadEmployees() {
    this.userService.getUsers(0, 100).subscribe({
      next: (page: any) => {
        this.employees.set(page.content);
      },
      error: (err: any) => console.error('Failed to load employees', err),
    });
  }

  loadDailyAttendance() {
    const date = this.selectedDate();
    if (!date) return;

    this.attendanceService.getAllAttendanceByDate(date).subscribe({
      next: (data: Attendance[]) => {
        // Sort: notified first
        const sorted = [...data].sort((a, b) => {
          const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
          const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
          return bHasNotif - aHasNotif;
        });
        this.attendanceRecords.set(sorted);
      },
      error: (err: any) => console.error('Failed to load daily attendance', err),
    });
  }

  loadEmployeeTimesheet() {
    const empId = this.selectedEmployeeId();
    const start = this.startDate();
    const end = this.endDate();

    if (!empId || !start || !end) return;

    this.attendanceService.getEmployeeTimesheet(empId, start, end).subscribe({
      next: (data: TimesheetSummary) => {
        this.selectedEmployeeTimesheet.set(data);
      },
      error: (err: any) => console.error('Failed to load timesheet', err),
    });
  }

  openMarkModal() {
    this.showMarkModal.set(true);
  }

  closeMarkModal() {
    this.showMarkModal.set(false);
  }

  downloadTimesheet() {
    const empId = this.selectedEmployeeId();
    const start = this.startDate();
    const end = this.endDate();

    if (!empId || !start || !end) return;

    this.attendanceService.downloadEmployeeTimesheet(empId, start, end).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `timesheet_${empId}_${start}_${end}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => this.dialogService.open('Error', 'Download failed'),
    });
  }

  getEmployeeName(userId: string): string {
    const user = this.employees().find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
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
}
