import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LeaveService } from '../../services/leave.service';
import { LeaveResponse, LeaveBalance, LeaveType } from '../../models/leave.model';
import { DialogService } from '../../../../core/services/dialog.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { finalize } from 'rxjs';
import { HeaderService } from '../../../../core/services/header.service';
import { LeaveRejectModalComponent } from '../../components/leave-reject-modal/leave-reject-modal.component';

@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LeaveRejectModalComponent],
  templateUrl: './leave-management.component.html',
  styleUrls: ['./leave-management.component.scss'],
})
export class LeaveManagementComponent implements OnInit {
  activeTab = signal<'requests' | 'balances'>('requests');

  // Requests Tab State
  requests = signal<LeaveResponse[]>([]);
  unreadLeaveIds = new Set<string>();
  totalElements = signal<number>(0);
  page = signal<number>(0);
  size = signal<number>(10);
  loading = signal<boolean>(false);

  // Filters
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('');
  selectedLeaveType = signal<string>('');
  startDate = signal<string>('');
  endDate = signal<string>('');

  leaveTypes = signal<LeaveType[]>([]);

  // Action Modal
  showRejectModal = signal<boolean>(false);
  selectedRequestId = signal<string | null>(null);

  // Balances Tab State
  balanceSearchQuery = signal<string>('');
  targetUserBalances = signal<LeaveBalance[]>([]);
  targetUserId = signal<string>('');

  constructor(
    private leaveService: LeaveService,
    private dialogService: DialogService,
    private notificationService: NotificationService,
    private headerService: HeaderService,
  ) {}

  ngOnInit() {
    this.headerService.setTitle(
      'Leave Management',
      'Manage employee leave requests',
      'bi bi-calendar-check',
    );
    this.loadUnreadLeaveIds();
    this.loadLeaveTypes();
    this.loadRequests();
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

  loadLeaveTypes() {
    this.leaveService.getAllLeaveTypes().subscribe((types) => this.leaveTypes.set(types));
  }

  loadRequests() {
    this.loading.set(true);
    this.leaveService
      .getAllRequests(
        this.page(),
        this.size(),
        this.searchQuery() || undefined,
        this.selectedStatus() || undefined,
        this.startDate() || undefined,
        this.endDate() || undefined,
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: any) => {
          // Sort: notified first
          const sorted = [...response.content].sort((a: LeaveResponse, b: LeaveResponse) => {
            const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
            const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
            return bHasNotif - aHasNotif;
          });
          this.requests.set(sorted);
          this.totalElements.set(response.totalElements);
        },
        error: (err) => console.error('Error loading requests', err),
      });
  }

  onSearch() {
    this.page.set(0);
    this.loadRequests();
  }

  onPageChange(newPage: number) {
    this.page.set(newPage);
    this.loadRequests();
  }

  approve(requestId: string) {
    if (!confirm('Are you sure you want to approve this request?')) return;

    this.leaveService
      .takeAction({
        leaveRequestId: requestId,
        status: 'APPROVED',
      })
      .subscribe({
        next: () => {
          this.dialogService.open('Success', 'Leave Approved Successfully');
          this.loadRequests();
        },
        error: (err) =>
          this.dialogService.open(
            'Error',
            'Error approving leave: ' + (err.error?.message || err.message),
          ),
      });
  }

  openRejectModal(requestId: string) {
    this.selectedRequestId.set(requestId);
    this.showRejectModal.set(true);
  }

  // Balance Tab Logic
  viewUserBalances(userId: string) {
    this.activeTab.set('balances');
    this.targetUserId.set(userId);
    this.fetchBalances(userId);
  }

  fetchBalances(userId: string) {
    if (!userId) return;
    this.leaveService.getUserBalances(userId).subscribe({
      next: (balances) => this.targetUserBalances.set(balances),
      error: (err) => console.error('Error fetching balances', err),
    });
  }
}
