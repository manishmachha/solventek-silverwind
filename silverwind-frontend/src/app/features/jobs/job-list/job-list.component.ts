import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JobService } from '../../../core/services/job.service';
import { Job } from '../../../core/models/job.model';
import { HeaderService } from '../../../core/services/header.service';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApplicationFormComponent } from '../../applications/application-form/application-form.component';
import { OrganizationLogoComponent } from '../../../shared/components/organization-logo/organization-logo.component';
import { AuthStore } from '../../../core/stores/auth.store';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatDialogModule, OrganizationLogoComponent],
  template: `
    <div class="space-y-8">
      <!-- Header Section -->
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Title and Description moved to HeaderService -->
        <div></div>
        <a
          *ngIf="authStore.hasPermission('JOB_CREATE')"
          routerLink="/jobs/create"
          class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        >
          <i class="bi bi-plus-lg mr-2"></i> Post New Job
        </a>
      </div>

      <!-- Filters & Search Bar -->
      <div
        class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center"
      >
        <div class="relative flex-1 w-full">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i class="bi bi-search text-gray-400"></i>
          </div>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="applyFilters()"
            placeholder="Search by title, organization, or location..."
            class="block w-full pl-10 pr-3 py-3 border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
          />
        </div>
        <div class="flex gap-4 w-full md:w-auto">
          <select
            [(ngModel)]="statusFilter"
            (change)="applyFilters()"
            class="block w-full md:w-48 pl-3 pr-10 py-3 text-base border-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-xl bg-gray-50"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="VENDOR_SUBMITTED">Vendor Submitted</option>
            <option value="ADMIN_VERIFIED">Admin Verified</option>
            <option value="TA_ENRICHED">TA Enriched</option>
            <option value="ADMIN_FINAL_VERIFIED">Final Verified</option>
            <option value="PUBLISHED">Published</option>
            <option value="PAUSED">Paused</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <!-- Job Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <ng-container *ngFor="let job of filteredJobs()">
          <div
            class="group relative bg-white rounded-2xl shadow-sm border transition-all duration-300 flex flex-col h-full overflow-hidden"
            [ngClass]="
              hasNotification(job.id)
                ? 'border-red-300 ring-2 ring-red-100 hover:shadow-red-100'
                : 'border-gray-100 hover:shadow-xl hover:border-indigo-100'
            "
          >
            <!-- Notification Indicator -->
            <div *ngIf="hasNotification(job.id)" class="absolute top-3 right-3 z-10">
              <span class="flex h-3 w-3">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
                ></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <!-- Badge & Type -->
            <div class="px-6 py-5 flex justify-between items-start">
              <div class="flex gap-3">
                <app-organization-logo
                  [org]="job.organization"
                  [orgId]="job.organization?.id"
                  size="md"
                  [rounded]="true"
                  class="shrink-0"
                ></app-organization-logo>
                <div class="flex flex-col">
                  <span class="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-1">
                    {{ job.organization?.name || 'Internal' }}
                  </span>
                  <h3
                    class="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors"
                  >
                    <a [routerLink]="['/jobs', job.id]">{{ job.title }}</a>
                  </h3>
                </div>
              </div>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                [ngClass]="getStatusClass(job.status)"
              >
                {{ job.status.replace('_', ' ') | titlecase }}
              </span>
            </div>

            <!-- Content -->
            <div class="px-6 py-2 flex-1">
              <p class="text-sm text-gray-500 line-clamp-3">
                {{ job.description }}
              </p>

              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  <i class="bi bi-briefcase mr-1.5"></i> {{ job.employmentType | titlecase }}
                </span>
                <span
                  *ngIf="job.location"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  <i class="bi bi-geo-alt mr-1.5"></i> {{ job.location }}
                </span>
                <span
                  *ngIf="job.createdAt"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  <i class="bi bi-calendar3 mr-1.5"></i> {{ job.createdAt | date: 'mediumDate' }}
                </span>
              </div>
            </div>

            <!-- Footer Action -->
            <div
              class="px-6 py-4 bg-gray-50 border-t border-gray-100 mt-4 group-hover:bg-indigo-50 transition-colors flex justify-between items-center"
            >
              <a
                [routerLink]="['/jobs', job.id]"
                class="text-xs text-gray-400 hover:text-indigo-600"
                >ID: {{ job.id.substring(0, 8) }}...</a
              >

              <div class="flex gap-2">
                <button
                  *ngIf="job.status === 'PUBLISHED'"
                  (click)="openApplyDialog(job)"
                  class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Apply
                </button>
                <a
                  [routerLink]="['/jobs', job.id]"
                  class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Details <i class="bi bi-arrow-right ml-1"></i>
                </a>
              </div>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- Empty State -->
      <div
        *ngIf="filteredJobs().length === 0"
        class="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300"
      >
        <div class="mx-auto h-12 w-12 text-gray-400">
          <i class="bi bi-briefcase text-4xl"></i>
        </div>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
        <p class="mt-1 text-sm text-gray-500">
          Get started by creating a new job posting or adjusting your filters.
        </p>
        <div class="mt-6">
          <a
            *ngIf="authStore.hasPermission('JOB_CREATE')"
            routerLink="/jobs/create"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <i class="bi bi-plus-lg mr-2"></i> Create Job
          </a>
        </div>
      </div>

      <!-- Pagination Controls (Basic) -->
      <div
        class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm"
        *ngIf="totalPages > 1"
      >
        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Showing page <span class="font-medium">{{ currentPage + 1 }}</span> of
              <span class="font-medium">{{ totalPages }}</span>
            </p>
          </div>
          <div>
            <nav
              class="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <button
                (click)="changePage(currentPage - 1)"
                [disabled]="currentPage === 0"
                class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span class="sr-only">Previous</span>
                <i class="bi bi-chevron-left h-5 w-5"></i>
              </button>
              <button
                (click)="changePage(currentPage + 1)"
                [disabled]="currentPage >= totalPages - 1"
                class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span class="sr-only">Next</span>
                <i class="bi bi-chevron-right h-5 w-5"></i>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class JobListComponent implements OnInit {
  jobService = inject(JobService);
  headerService = inject(HeaderService);
  dialog = inject(MatDialog);
  authStore = inject(AuthStore);
  private notificationService = inject(NotificationService);

  jobs = signal<Job[]>([]);
  filteredJobs = signal<Job[]>([]);
  unreadJobIds = new Set<string>();

  searchQuery = '';
  statusFilter = '';

  currentPage = 0;
  totalPages = 0;
  totalElements = 0;

  ngOnInit() {
    this.headerService.setTitle(
      'Job Board',
      'Explore and apply to opportunities',
      'bi bi-briefcase',
    );
    this.loadUnreadJobIds();
    this.loadJobs();
  }

  loadUnreadJobIds() {
    this.notificationService.getUnreadEntityIds('JOB').subscribe({
      next: (ids) => (this.unreadJobIds = new Set(ids)),
      error: () => (this.unreadJobIds = new Set()),
    });
  }

  hasNotification(jobId: string): boolean {
    return this.unreadJobIds.has(jobId);
  }

  loadJobs(page: number = 0) {
    this.jobService.getJobs(page).subscribe((data) => {
      this.jobs.set(data.content);
      this.totalElements = data.totalElements;
      this.totalPages = data.totalPages;
      this.currentPage = data.number; // Assuming standard spring pageable
      this.applyFilters();
    });
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.loadJobs(page);
    }
  }

  applyFilters() {
    let result = this.jobs();

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.organization?.name.toLowerCase().includes(q) ||
          (j.location && j.location.toLowerCase().includes(q)),
      );
    }

    if (this.statusFilter) {
      result = result.filter((j) => j.status === this.statusFilter);
    }

    // Sort: notified jobs first, then by createdAt desc
    result = [...result].sort((a, b) => {
      const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
      const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
      if (bHasNotif !== aHasNotif) return bHasNotif - aHasNotif;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    this.filteredJobs.set(result);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'SUBMITTED':
        return 'bg-gray-100 text-gray-800';
      case 'VENDOR_SUBMITTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'ADMIN_VERIFIED':
        return 'bg-blue-100 text-blue-800';
      case 'TA_ENRICHED':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN_FINAL_VERIFIED':
        return 'bg-cyan-100 text-cyan-800';
      case 'PAUSED':
        return 'bg-orange-100 text-orange-800';
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  openApplyDialog(job: Job) {
    this.dialog.open(ApplicationFormComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { job },
    });
  }
}
