import { Component, OnInit, inject, signal, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

import { ApplicationService } from '../../../core/services/application.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HeaderService } from '../../../core/services/header.service';
import { JobApplication, ApplicationStatus } from '../../../core/models/application.model';
import { OrganizationLogoComponent } from '../../../shared/components/organization-logo/organization-logo.component';

@Component({
  selector: 'app-track-application-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    FormsModule,
    OrganizationLogoComponent
  ],
  template: `
    <div class="p-6 max-w-[1600px] mx-auto space-y-6">
      <!-- Header Removed -->

      <!-- Filters & Actions -->
      <div
        class="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
      >
        <div class="flex-1 relative">
          <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            [(ngModel)]="searchText"
            (ngModelChange)="applyFilter()"
            placeholder="Search by job title or company..."
            class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-hidden transition-all text-sm"
          />
        </div>

        <div class="w-full md:w-64">
          <div class="relative">
            <select
              [(ngModel)]="statusFilter"
              (ngModelChange)="applyFilter()"
              class="w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-hidden transition-all text-sm cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option *ngFor="let status of statuses" [value]="status">
                {{ formatStatus(status) }}
              </option>
            </select>
            <i
              class="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            ></i>
          </div>
        </div>
      </div>

      <!-- Table Card -->
      <table mat-table [dataSource]="dataSource" matSort class="w-full">
        <!-- Job Title Column -->
        <ng-container matColumnDef="jobTitle">
          <th
            mat-header-cell
            *matHeaderCellDef
            mat-sort-header
            class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50"
          >
            Role
          </th>
          <td mat-cell *matCellDef="let app" class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div
                class="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0"
              >
                {{ app.job.title.charAt(0) }}
              </div>
              <div>
                <div class="font-bold text-gray-900">{{ app.job.title }}</div>
                <div class="text-xs text-gray-500">ID: #{{ app.job.id.substring(0, 8) }}</div>
              </div>
            </div>
          </td>
        </ng-container>

        <!-- Applicant Column (New) -->
        <ng-container matColumnDef="applicant">
          <th
            mat-header-cell
            *matHeaderCellDef
            mat-sort-header
            class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50"
          >
            Applicant
          </th>
          <td mat-cell *matCellDef="let app" class="px-6 py-4">
            <div class="flex flex-col">
              <span class="font-medium text-gray-900">{{ app.firstName }} {{ app.lastName }}</span>
              <span class="text-xs text-gray-500">{{ app.email }}</span>
            </div>
          </td>
        </ng-container>

        <!-- Company Column -->
        <ng-container matColumnDef="company">
          <th
            mat-header-cell
            *matHeaderCellDef
            mat-sort-header
            class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50"
          >
            Company
          </th>
          <td mat-cell *matCellDef="let app" class="px-6 py-4">
            <div class="flex items-center gap-2">
              <app-organization-logo
                [org]="app.job.organization"
                [orgId]="app.job.organization?.id"
                size="sm"
                [rounded]="true"
              ></app-organization-logo>
              <span class="font-medium text-gray-700">{{
                app.job.organization?.name || 'Unknown'
              }}</span>
            </div>
          </td>
        </ng-container>

        <!-- Applied Date Column -->
        <ng-container matColumnDef="createdAt">
          <th
            mat-header-cell
            *matHeaderCellDef
            mat-sort-header
            class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50"
          >
            Applied On
          </th>
          <td mat-cell *matCellDef="let app" class="px-6 py-4 text-gray-600">
            <div class="flex items-center gap-2">
              <i class="bi bi-calendar3 text-gray-400"></i>
              <span>{{ app.createdAt | date: 'mediumDate' }}</span>
            </div>
          </td>
        </ng-container>

        <!-- Status Column -->
        <ng-container matColumnDef="status">
          <th
            mat-header-cell
            *matHeaderCellDef
            mat-sort-header
            class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50"
          >
            Status
          </th>
          <td mat-cell *matCellDef="let app" class="px-6 py-4">
            <span
              [ngClass]="getStatusClass(app.status)"
              class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border w-fit block"
            >
              {{ formatStatus(app.status) }}
            </span>
          </td>
        </ng-container>

        <!-- Action Column -->
        <ng-container matColumnDef="actions">
          <th
            mat-header-cell
            *matHeaderCellDef
            class="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50 text-right"
          ></th>
          <td mat-cell *matCellDef="let app" class="px-6 py-4 text-right">
            <a
              [routerLink]="['/applications', app.id]"
              class="text-gray-400 hover:text-indigo-600 transition-colors p-2"
              matTooltip="View Details"
            >
              <mat-icon>visibility</mat-icon>
            </a>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr
          mat-row
          *matRowDef="let row; columns: displayedColumns"
          class="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0"
        ></tr>

        <!-- Empty State -->
        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell" colspan="6">
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <div
                class="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4"
              >
                <mat-icon class="text-2xl">search_off</mat-icon>
              </div>
              <h3 class="text-lg font-bold text-gray-900">No applications found</h3>
              <p class="text-gray-500 max-w-sm mx-auto mt-2">
                We couldn't find any applications matching your filters.
              </p>
              <button
                (click)="clearFilters()"
                mat-button
                color="primary"
                class="mt-4"
                *ngIf="searchText || statusFilter"
              >
                Clear Filters
              </button>
            </div>
          </td>
        </tr>
      </table>

      <mat-paginator
        [pageSize]="20"
        [pageSizeOptions]="[10, 20, 50, 100]"
        class="border-t border-gray-100"
      ></mat-paginator>
    </div>
  `,
})
export class TrackApplicationListComponent implements OnInit, AfterViewInit {
  private appService = inject(ApplicationService);
  private headerService = inject(HeaderService);
  private notificationService = inject(NotificationService);

  // View Children
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // State
  dataSource = new MatTableDataSource<JobApplication>([]);
  unreadAppIds = new Set<string>();
  loading = signal<boolean>(true);

  // Filters
  searchText = '';
  statusFilter: ApplicationStatus | '' = '';

  displayedColumns = ['jobTitle', 'applicant', 'company', 'createdAt', 'status', 'actions'];

  statuses: ApplicationStatus[] = [
    'APPLIED',
    'SHORTLISTED',
    'INTERVIEW_SCHEDULED',
    'INTERVIEW_PASSED',
    'INTERVIEW_FAILED',
    'OFFERED',
    'ONBOARDING_IN_PROGRESS',
    'ONBOARDED',
    'REJECTED',
    'DROPPED',
  ];

  ngOnInit() {
    this.headerService.setTitle(
      'Track Applications',
      'Status of jobs you have applied to',
      'bi bi-cursor',
    );
    this.loadUnreadAppIds();
    this.setupFilterPredicate();
    this.loadApplications();
  }

  loadUnreadAppIds() {
    this.notificationService.getUnreadEntityIds('APPLICATION').subscribe({
      next: (ids) => (this.unreadAppIds = new Set(ids)),
      error: () => (this.unreadAppIds = new Set()),
    });
  }

  hasNotification(appId: string): boolean {
    return this.unreadAppIds.has(appId);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.setupSorting();
  }

  loadApplications() {
    this.loading.set(true);

    // Fetch a large page to simulate "All" for client-side ops
    this.appService.getApplications(undefined, 0, 1000, 'OUTBOUND').subscribe({
      next: (page) => {
        // Sort: notified first
        const sorted = [...page.content].sort((a, b) => {
          const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
          const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
          return bHasNotif - aHasNotif;
        });
        this.dataSource.data = sorted;
        this.loading.set(false);

        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      },
      error: () => this.loading.set(false),
    });
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: JobApplication, filter: string) => {
      const searchTerms = JSON.parse(filter);
      const text = searchTerms.text.toLowerCase();
      const status = searchTerms.status;

      // Check Status
      const matchesStatus = status ? data.status === status : true;

      // Check Text (Job Title, Company, Applicant Name/Email)
      const matchesText =
        !text ||
        data.job.title.toLowerCase().includes(text) ||
        (data.job.organization?.name || '').toLowerCase().includes(text) ||
        data.firstName.toLowerCase().includes(text) ||
        data.lastName.toLowerCase().includes(text) ||
        data.email.toLowerCase().includes(text);

      return matchesStatus && matchesText;
    };
  }

  setupSorting() {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'jobTitle':
          return item.job.title;
        case 'company':
          return item.job.organization?.name || '';
        case 'applicant':
          return item.firstName + ' ' + item.lastName;
        default:
          return (item as any)[property];
      }
    };
  }

  applyFilter() {
    const filterValue = JSON.stringify({
      text: this.searchText,
      status: this.statusFilter,
    });
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters() {
    this.searchText = '';
    this.statusFilter = '';
    this.applyFilter();
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'APPLIED':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100/50';
      case 'SHORTLISTED':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-100/50';
      case 'INTERVIEW_SCHEDULED':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100/50';
      case 'INTERVIEW_PASSED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-100/50';
      case 'INTERVIEW_FAILED':
        return 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-100/50';
      case 'OFFERED':
        return 'bg-green-50 text-green-700 border-green-200 ring-1 ring-green-100/50';
      case 'ONBOARDING_IN_PROGRESS':
        return 'bg-teal-50 text-teal-700 border-teal-200 ring-1 ring-teal-100/50';
      case 'ONBOARDED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200 font-bold';
      case 'REJECTED':
      case 'DROPPED':
        return 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100/50';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }
}
