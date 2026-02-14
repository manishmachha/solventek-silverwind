import { Component, OnInit, ViewChild, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { TicketService } from '../../../../core/services/ticket.service';
import { HeaderService } from '../../../../core/services/header.service';
import { Ticket } from '../../../../core/models/ticket.model';
import { TicketCreateComponent } from '../ticket-create/ticket-create.component';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatSortModule,
    MatPaginatorModule,
    MatDialogModule,
    MatTooltipModule,
    MatInputModule,
    MatSelectModule,
    DatePipe,
    TitleCasePipe,
  ],
  templateUrl: './ticket-list.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class TicketListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'ticketNumber',
    'subject',
    'type',
    'priority',
    'status',
    'createdAt',
  ];
  dataSource = new MatTableDataSource<Ticket>([]);
  allTickets: Ticket[] = [];

  filterStatus = 'ALL';
  searchQuery = '';

  statusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Open', value: 'OPEN' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
    { label: 'Pending Vendor', value: 'PENDING_VENDOR' },
    { label: 'Pending Client', value: 'PENDING_CLIENT' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  loaderSub: Subscription | null = null;

  private ticketService = inject(TicketService);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  unreadTicketIds = new Set<string>();

  ngOnInit(): void {
    this.headerService.setTitle(
      'Support Tickets',
      'Track and manage your requests and queries',
      'bi bi-life-preserver',
    );
    this.loadUnreadTicketIds();
    this.startLiveUpdates();
  }

  loadUnreadTicketIds() {
    this.notificationService.getUnreadEntityIds('TICKET').subscribe({
      next: (ids) => (this.unreadTicketIds = new Set(ids)),
      error: () => (this.unreadTicketIds = new Set()),
    });
  }

  hasNotification(ticketId: string): boolean {
    return this.unreadTicketIds.has(ticketId);
  }

  ngOnDestroy() {
    if (this.loaderSub) {
      this.loaderSub.unsubscribe();
    }
  }

  startLiveUpdates() {
    // Poll every 15 seconds
    this.loaderSub = timer(0, 15000)
      .pipe(
        switchMap(() =>
          this.ticketService.getMyTicketsForPolling().pipe(
            catchError((err: any) => {
              console.error('Polling error', err);
              return []; // Return empty array or handle gracefully to keep timer alive
            }),
          ),
        ),
      )
      .subscribe((tickets) => {
        if (Array.isArray(tickets) && tickets.length > 0) {
          this.updateTable(tickets);
        }
      });
  }

  updateTable(tickets: Ticket[]) {
    this.allTickets = tickets;

    // Smart Sorting:
    // 1. Unread Tickets (from NotificationService or internal count)
    // 2. High Priority/Critical Tickets
    // 3. Newest Created
    const sorted = [...tickets].sort((a, b) => {
      // Unread check
      const aUnread = this.hasNotification(a.id) || (a.unreadCountForEmployee || 0) > 0;
      const bUnread = this.hasNotification(b.id) || (b.unreadCountForEmployee || 0) > 0;
      if (aUnread && !bUnread) return -1;
      if (!aUnread && bUnread) return 1;

      // Custom secondary sort if needed, otherwise Date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    this.dataSource.data = sorted;
    if (!this.dataSource.sort) this.dataSource.sort = this.sort;
    if (!this.dataSource.paginator) this.dataSource.paginator = this.paginator;

    // Re-apply filter if exists
    if (this.searchQuery || this.filterStatus !== 'ALL') {
      this.applyFilter();
    }
  }

  applyFilter() {
    let subset = this.allTickets;

    if (this.filterStatus !== 'ALL') {
      subset = subset.filter((t) => t.status === this.filterStatus);
    }

    const filterValue = this.searchQuery.trim().toLowerCase();

    if (filterValue) {
      subset = subset.filter(
        (t: Ticket) =>
          t.subject?.toLowerCase().includes(filterValue) ||
          t.ticketNumber?.toLowerCase().includes(filterValue) ||
          (t.priority && t.priority.toLowerCase().includes(filterValue)) ||
          (t.status && t.status.toLowerCase().includes(filterValue)) ||
          (t.type && t.type.toLowerCase().includes(filterValue)),
      );
    }

    this.dataSource.data = subset;
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(TicketCreateComponent, {
      width: '100%',
      maxWidth: '600px',
      panelClass: 'custom-dialog-container',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Manual refresh after creation
        this.ticketService.getMyTickets().subscribe((t) => this.updateTable(t));
      }
    });
  }

  getOpenCount() {
    return this.allTickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status.startsWith('PENDING'),
    ).length;
  }

  getResolvedCount() {
    return this.allTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  }

  getHighPriorityCount() {
    return this.allTickets.filter((t) => t.priority === 'HIGH' || t.priority === 'CRITICAL').length;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'PENDING_APPROVAL':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'PENDING_VENDOR':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'PENDING_CLIENT':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'RESOLVED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'CRITICAL':
        return 'text-red-700 font-bold';
      case 'HIGH':
        return 'text-orange-600 font-semibold';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'LOW':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  }
}
