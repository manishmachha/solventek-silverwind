import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../../core/services/application.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HeaderService } from '../../../core/services/header.service';
import { JobApplication } from '../../../core/models/application.model';

@Component({
  selector: 'app-vendor-application-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Header Removed -->

      <div class="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <ul role="list" class="divide-y divide-gray-200">
          <li *ngFor="let app of applications()">
            <div class="px-4 py-4 flex items-center sm:px-6 hover:bg-gray-50 transition-colors">
              <div class="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                <div class="truncate">
                  <div class="flex text-sm">
                    <p class="font-medium text-indigo-600 truncate">
                      {{ app.job.title }}
                    </p>
                    <p class="ml-1 shrink-0 font-normal text-gray-500">
                      - {{ app.firstName }} {{ app.lastName }}
                    </p>
                  </div>
                  <div class="mt-2 flex">
                    <div class="flex items-center text-sm text-gray-500">
                      <i class="bi bi-building mr-1.5 text-gray-400"></i>
                      <p>{{ app.job.organization?.name || 'Client' }}</p>
                    </div>
                    <span class="mx-2 text-gray-300">|</span>
                    <div class="flex items-center text-sm text-gray-500">
                      <i class="bi bi-clock mr-1.5 text-gray-400"></i>
                      <p>Applied {{ app.createdAt | date }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="ml-5 shrink-0 flex items-center gap-4">
                <span
                  class="px-2 py-1 text-xs font-semibold rounded-full"
                  [ngClass]="{
                    'bg-yellow-100 text-yellow-800': app.status === 'APPLIED',
                    'bg-blue-100 text-blue-800': app.status === 'SHORTLISTED',
                    'bg-purple-100 text-purple-800':
                      app.status === 'INTERVIEW_SCHEDULED' || app.status === 'INTERVIEW_PASSED',
                    'bg-green-100 text-green-800':
                      app.status === 'OFFERED' ||
                      app.status === 'ONBOARDED' ||
                      app.status === 'CONVERTED_TO_FTE',
                    'bg-red-100 text-red-800':
                      app.status === 'REJECTED' ||
                      app.status === 'DROPPED' ||
                      app.status === 'INTERVIEW_FAILED',
                  }"
                >
                  {{ app.status }}
                </span>
                <i class="bi bi-chevron-right text-gray-400"></i>
              </div>
            </div>
          </li>
          <li *ngIf="applications().length === 0" class="px-4 py-12 text-center text-gray-500">
            You haven't submitted any applications yet.
          </li>
        </ul>
      </div>
    </div>
  `,
})
export class VendorApplicationListComponent implements OnInit {
  applicationService = inject(ApplicationService);
  notificationService = inject(NotificationService);
  headerService = inject(HeaderService);
  applications = signal<JobApplication[]>([]);
  unreadAppIds = new Set<string>();

  ngOnInit() {
    this.headerService.setTitle(
      'My Applications',
      'Track the status of your candidates',
      'bi bi-people',
    );
    this.loadUnreadAppIds();
    this.applicationService.getApplications().subscribe((page) => {
      // Sort: notified first
      const sorted = [...page.content].sort((a, b) => {
        const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
        const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
        return bHasNotif - aHasNotif;
      });
      this.applications.set(sorted);
    });
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
}
