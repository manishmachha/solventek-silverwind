import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeaveService } from '../../services/leave.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LeaveBalance, LeaveRequest, LeaveResponse, LeaveType } from '../../models/leave.model';
import { HeaderService } from '../../../../core/services/header.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartOptions, ChartType } from 'chart.js';

@Component({
  selector: 'app-my-leaves',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './my-leaves.component.html',
})
export class MyLeavesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private leaveService = inject(LeaveService);
  private dialogService = inject(DialogService);
  private notificationService = inject(NotificationService);
  private headerService = inject(HeaderService);

  activeTab = signal<'dashboard' | 'apply' | 'history'>('dashboard');

  leaveTypes = signal<LeaveType[]>([]);
  balances = signal<LeaveBalance[]>([]);
  history = signal<LeaveResponse[]>([]);
  unreadLeaveIds = new Set<string>();

  submitting = signal<boolean>(false);

  applyForm: FormGroup = this.fb.group({
    leaveTypeId: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    reason: ['', Validators.required],
  });

  // Chart Data
  public doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: false } },
  };

  constructor() {}

  ngOnInit() {
    this.headerService.setTitle('My Leaves', 'Track and request time off', 'bi bi-calendar-minus');
    this.loadUnreadLeaveIds();
    this.loadData();
    // Load leave types for dropdown
    this.leaveService.getAllLeaveTypes().subscribe((data) => this.leaveTypes.set(data));
  }

  loadUnreadLeaveIds() {
    this.notificationService.getUnreadEntityIds('LEAVE').subscribe({
      next: (ids) => (this.unreadLeaveIds = new Set(ids)),
      error: () => (this.unreadLeaveIds = new Set()),
    });
  }

  hasNotification(leaveId: string): boolean {
    return this.unreadLeaveIds.has(leaveId);
  }

  loadData() {
    this.leaveService.getMyBalances().subscribe((data) => this.balances.set(data));
    this.leaveService.getMyRequests().subscribe((data) => {
      // Sort: notified first
      const sorted = [...data].sort((a, b) => {
        const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
        const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
        return bHasNotif - aHasNotif;
      });
      this.history.set(sorted);
    });
  }

  getChartData(balance: LeaveBalance): ChartData<'doughnut'> {
    return {
      labels: ['Used', 'Remaining'],
      datasets: [
        {
          data: [balance.usedDays, balance.remainingDays],
          backgroundColor: ['#e5e7eb', this.getColorForType(balance.leaveTypeName)],
          borderWidth: 0,
        },
      ],
    };
  }

  getColorForType(name: string): string {
    const map: any = {
      'Annual Leave': '#4f46e5', // Indigo
      'Sick Leave': '#ef4444', // Red
      'Casual Leave': '#10b981', // Emerald
      Maternity: '#ec4899', // Pink
    };
    return map[name] || '#3b82f6'; // Default Blue
  }

  onSubmit() {
    if (this.applyForm.invalid) return;

    // Validate logic (e.g. End Date >= Start Date)
    const start = new Date(this.applyForm.value.startDate);
    const end = new Date(this.applyForm.value.endDate);

    if (end < start) {
      this.dialogService.open('Validation Error', 'End date cannot be before start date');
      return;
    }

    this.submitting.set(true);
    const request: LeaveRequest = this.applyForm.value;

    this.leaveService.applyForLeave(request).subscribe({
      next: () => {
        this.dialogService.open('Success', 'Leave application submitted successfully!');
        this.applyForm.reset();
        this.activeTab.set('history');
        this.loadData(); // Refresh history and possibly balances (if auto-deducted)
        this.submitting.set(false);
      },
      error: (err) => {
        console.error('Application failed', err);
        this.dialogService.open(
          'Error',
          'Failed to submit application: ' + (err.error?.message || 'Unknown error'),
        );
        this.submitting.set(false);
      },
    });
  }
}
