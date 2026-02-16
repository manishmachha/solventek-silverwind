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
    OrganizationLogoComponent,
  ],
  template: `
    <div class="md:p-8 p-4 mx-auto space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Track Applications</h1>
          <p class="text-gray-500 mt-1">Monitor the status of your outbound applications</p>
        </div>
      </div>

      <!-- Main Content Card -->
      <div class="card-modern overflow-hidden">
        <!-- Search & Filter Toolbar -->
        <div class="p-5 border-b border-gray-100 bg-gray-50/50">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <!-- Search Input -->
            <div class="md:col-span-5 relative group">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <mat-icon class="text-gray-400 group-focus-within:text-indigo-500 transition-colors"
                  >search</mat-icon
                >
              </div>
              <input
                type="text"
                [(ngModel)]="searchText"
                (ngModelChange)="applyFilter()"
                placeholder="Search by role, company or applicant..."
                class="input-modern pl-11! py-2.5! bg-white shadow-sm w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <!-- Status Filter -->
            <div class="md:col-span-4 relative">
              <select
                [(ngModel)]="statusFilter"
                (ngModelChange)="applyFilter()"
                class="input-modern w-full pl-4 pr-10 py-2.5! rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm cursor-pointer appearance-none"
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

            <!-- Reset -->
            <div class="md:col-span-3 flex justify-end">
              <button
                mat-button
                color="warn"
                (click)="clearFilters()"
                class="!bg-red-50 hover:!bg-red-100 !text-red-600 !rounded-lg transition-colors"
                *ngIf="searchText || statusFilter"
              >
                <mat-icon class="mr-1">filter_list_off</mat-icon>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <!-- TABLE VIEW (DESKTOP) -->
        <div class="hidden md:block overflow-x-auto">
          <table mat-table [dataSource]="dataSource" matSort class="w-full">
            <!-- Job Title Column -->
            <ng-container matColumnDef="jobTitle">
              <th
                mat-header-cell
                *matHeaderCellDef
                mat-sort-header
                class="pl-6! text-gray-600 font-semibold bg-gray-50/50"
              >
                Role
              </th>
              <td mat-cell *matCellDef="let app" class="pl-6!">
                <div class="flex items-center gap-3 py-3">
                  <div *ngIf="hasNotification(app.id)" class="relative flex h-2.5 w-2.5 shrink-0">
                    <span
                      class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                    ></span>
                    <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-semibold text-gray-900 leading-tight">{{
                      app.job.title
                    }}</span>
                    <span class="text-xs text-gray-500">ID: #{{ app.job.id.substring(0, 8) }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Applicant Column -->
            <ng-container matColumnDef="applicant">
              <th
                mat-header-cell
                *matHeaderCellDef
                mat-sort-header
                class="text-gray-600 font-semibold bg-gray-50/50"
              >
                Applicant
              </th>
              <td mat-cell *matCellDef="let app">
                <div class="flex flex-col">
                  <span class="font-medium text-gray-900"
                    >{{ app.firstName }} {{ app.lastName }}</span
                  >
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
                class="text-gray-600 font-semibold bg-gray-50/50"
              >
                Company
              </th>
              <td mat-cell *matCellDef="let app">
                <div class="flex items-center gap-3">
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
                class="text-gray-600 font-semibold bg-gray-50/50"
              >
                Applied On
              </th>
              <td mat-cell *matCellDef="let app" class="text-gray-600">
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
                class="text-gray-600 font-semibold bg-gray-50/50"
              >
                Status
              </th>
              <td mat-cell *matCellDef="let app">
                <span
                  [class]="
                    getStatusClass(app.status) +
                    ' px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border w-fit block'
                  "
                >
                  {{ formatStatus(app.status) }}
                </span>
              </td>
            </ng-container>

            <!-- Action Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="pr-6! bg-gray-50/50 text-right"></th>
              <td mat-cell *matCellDef="let app" class="pr-6! text-right">
                <a
                  [routerLink]="['/applications', app.id]"
                  class="text-gray-400 hover:text-indigo-600 transition-colors p-2 inline-flex"
                  matTooltip="View Details"
                >
                  <mat-icon>chevron_right</mat-icon>
                </a>
              </td>
            </ng-container>

            <tr
              mat-header-row
              *matHeaderRowDef="displayedColumns"
              class="h-12 border-b border-gray-100"
            ></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: displayedColumns"
              class="transition-colors cursor-pointer border-b border-gray-50 h-20"
              [ngClass]="
                hasNotification(row.id)
                  ? 'bg-red-50/50 ring-1 ring-red-200 hover:bg-red-100/50'
                  : 'hover:bg-indigo-50/30'
              "
            ></tr>

            <!-- Empty State -->
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell p-12 text-center" colspan="6">
                <div class="flex flex-col items-center justify-center text-gray-400">
                  <mat-icon class="text-4xl mb-2 opacity-20">search_off</mat-icon>
                  <h3 class="text-lg font-bold text-gray-900">No applications found</h3>
                  <p class="mt-1 text-gray-500">Try adjusting your search or filters</p>
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
        </div>

        <!-- MOBILE VIEW -->
        <div class="md:hidden bg-gray-50/50 p-4 space-y-4">
          <div
            *ngFor="let app of dataSource.filteredData"
            class="card-modern p-4 flex flex-col gap-4 relative bg-white rounded-lg shadow-sm border border-gray-100"
            [ngClass]="hasNotification(app.id) ? 'ring-2 ring-red-200 border-red-300' : ''"
            [routerLink]="['/applications', app.id]"
          >
            <!-- Notification Indicator -->
            <div *ngIf="hasNotification(app.id)" class="absolute top-3 right-3 z-10">
              <span class="flex h-3 w-3">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                ></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>

            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-bold text-gray-900 leading-tight">
                  {{ app.job.title }}
                </h3>
                <span class="text-xs text-gray-500">ID: #{{ app.job.id.substring(0, 8) }}</span>
              </div>
            </div>

            <div class="flex items-center gap-3 pt-3 mt-2 border-t border-gray-100">
              <app-organization-logo
                [org]="app.job.organization"
                [orgId]="app.job.organization?.id"
                size="xs"
                [rounded]="true"
              ></app-organization-logo>
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-gray-900 leading-tight">{{
                  app.job.organization?.name || 'Unknown'
                }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between mt-2">
              <div class="flex flex-col">
                <span class="text-xs text-gray-500">Applicant</span>
                <span class="text-sm font-medium text-gray-900"
                  >{{ app.firstName }} {{ app.lastName }}</span
                >
              </div>
              <div class="flex flex-col items-end">
                <span class="text-xs text-gray-500">Applied On</span>
                <span class="text-sm font-medium text-gray-900">{{
                  app.createdAt | date: 'mediumDate'
                }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
              <span
                [class]="
                  getStatusClass(app.status) +
                  ' px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border w-fit block'
                "
              >
                {{ formatStatus(app.status) }}
              </span>
              <span class="text-indigo-600 text-sm font-medium flex items-center">
                View Details <i class="bi bi-chevron-right ml-1"></i>
              </span>
            </div>
          </div>

          <!-- Empty State Mobile -->
          <div
            *ngIf="dataSource.filteredData.length === 0"
            class="flex flex-col items-center justify-center py-12 text-center"
          >
            <div
              class="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4"
            >
              <mat-icon class="text-2xl">search_off</mat-icon>
            </div>
            <h3 class="text-lg font-bold text-gray-900">No applications found</h3>
          </div>
        </div>

        <mat-paginator
          [pageSize]="20"
          [pageSizeOptions]="[10, 20, 50, 100]"
          class="border-t border-gray-100"
        ></mat-paginator>
      </div>
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
