import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService, AuditLogEvent } from '../../../core/services/audit-log.service';
import { HeaderService } from '../../../core/services/header.service';

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 lg:p-8">
      <div class="p-4 md:p-6 lg:p-8">
        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div class="flex flex-col md:flex-row gap-4">
            <!-- Entity Type Filter -->
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <select
                [(ngModel)]="entityTypeFilter"
                (change)="applyFilters()"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Types</option>
                <option value="APPLICATION">Applications</option>
                <option value="JOB">Jobs</option>
                <option value="USER">Users</option>
                <option value="ROLE">Roles</option>
                <option value="PROJECT">Projects</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="ORGANIZATION">Organizations</option>
              </select>
            </div>

            <!-- Action Search -->
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Search Action</label>
              <div class="relative">
                <input
                  type="text"
                  [(ngModel)]="actionSearch"
                  (keyup.enter)="searchByAction()"
                  placeholder="Search by action..."
                  class="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>

            <!-- Reset Button -->
            <div class="flex items-end">
              <button
                (click)="resetFilters()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <i class="bi bi-arrow-counterclockwise mr-2"></i>Reset
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="flex justify-center py-12">
          <div
            class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"
          ></div>
        </div>

        <!-- Audit Log Table -->
        <div
          *ngIf="!loading()"
          class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Timestamp
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Entity Type
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Action
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Message
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Details
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let log of auditLogs()" class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ log.createdAt | date: 'medium' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getEntityTypeBadgeClass(log.entityType)">
                      {{ log.entityType }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getActionBadgeClass(log.action)">
                      {{ log.action }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700 max-w-md truncate">
                    {{ log.message || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <button
                      *ngIf="log.metadata"
                      (click)="toggleMetadata(log.id)"
                      class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      <i
                        class="bi"
                        [class.bi-chevron-down]="!expandedLogs.has(log.id)"
                        [class.bi-chevron-up]="expandedLogs.has(log.id)"
                      ></i>
                      {{ expandedLogs.has(log.id) ? 'Hide' : 'View' }}
                    </button>
                    <span *ngIf="!log.metadata" class="text-gray-400 text-sm">-</span>
                  </td>
                </tr>
                <tr *ngIf="auditLogs().length === 0">
                  <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                    <i class="bi bi-clock-history text-4xl mb-2 block text-gray-300"></i>
                    No audit logs found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Expanded Metadata Rows -->
          <ng-container *ngFor="let log of auditLogs()">
            <div
              *ngIf="expandedLogs.has(log.id) && log.metadata"
              class="px-6 py-4 bg-gray-50 border-t border-gray-200"
            >
              <div class="text-sm">
                <span class="font-medium text-gray-700">Metadata:</span>
                <pre class="mt-2 p-3 bg-gray-100 rounded-lg overflow-x-auto text-xs">{{
                  log.metadata | json
                }}</pre>
              </div>
            </div>
          </ng-container>

          <!-- Pagination -->
          <div
            class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between"
          >
            <div class="text-sm text-gray-500">
              Showing {{ currentPage * pageSize + 1 }} -
              {{ Math.min((currentPage + 1) * pageSize, totalElements) }} of {{ totalElements }}
            </div>
            <div class="flex gap-2">
              <button
                (click)="previousPage()"
                [disabled]="currentPage === 0"
                class="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                <i class="bi bi-chevron-left"></i> Previous
              </button>
              <button
                (click)="nextPage()"
                [disabled]="(currentPage + 1) * pageSize >= totalElements"
                class="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                Next <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AuditLogListComponent implements OnInit {
  private auditLogService = inject(AuditLogService);
  private headerService = inject(HeaderService);

  auditLogs = signal<AuditLogEvent[]>([]);
  loading = signal(true);
  expandedLogs = new Set<string>();

  entityTypeFilter = '';
  actionSearch = '';
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;

  Math = Math;

  ngOnInit() {
    this.headerService.setTitle(
      'Audit Logs',
      'System-wide activity history and security events',
      'bi bi-clock-history',
    );
    this.loadAuditLogs();
  }

  loadAuditLogs() {
    this.loading.set(true);
    this.auditLogService.getAuditLogs(this.currentPage, this.pageSize).subscribe({
      next: (page) => {
        this.auditLogs.set(page.content);
        this.totalElements = page.totalElements;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  applyFilters() {
    this.currentPage = 0;
    if (this.entityTypeFilter) {
      this.loading.set(true);
      this.auditLogService
        .getAuditLogsByEntityType(this.entityTypeFilter, this.currentPage, this.pageSize)
        .subscribe({
          next: (page) => {
            this.auditLogs.set(page.content);
            this.totalElements = page.totalElements;
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
    } else {
      this.loadAuditLogs();
    }
  }

  searchByAction() {
    if (!this.actionSearch.trim()) {
      this.loadAuditLogs();
      return;
    }
    this.currentPage = 0;
    this.loading.set(true);
    this.auditLogService
      .searchAuditLogs(this.actionSearch, this.currentPage, this.pageSize)
      .subscribe({
        next: (page) => {
          this.auditLogs.set(page.content);
          this.totalElements = page.totalElements;
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  resetFilters() {
    this.entityTypeFilter = '';
    this.actionSearch = '';
    this.currentPage = 0;
    this.loadAuditLogs();
  }

  toggleMetadata(logId: string) {
    if (this.expandedLogs.has(logId)) {
      this.expandedLogs.delete(logId);
    } else {
      this.expandedLogs.add(logId);
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.applyFilters();
    }
  }

  nextPage() {
    if ((this.currentPage + 1) * this.pageSize < this.totalElements) {
      this.currentPage++;
      this.applyFilters();
    }
  }

  getEntityTypeBadgeClass(entityType: string): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    const colors: Record<string, string> = {
      APPLICATION: 'bg-blue-100 text-blue-800',
      JOB: 'bg-purple-100 text-purple-800',
      USER: 'bg-green-100 text-green-800',
      ROLE: 'bg-orange-100 text-orange-800',
      PROJECT: 'bg-cyan-100 text-cyan-800',
      ONBOARDING: 'bg-indigo-100 text-indigo-800',
      ORGANIZATION: 'bg-pink-100 text-pink-800',
    };
    return `${base} ${colors[entityType] || 'bg-gray-100 text-gray-800'}`;
  }

  getActionBadgeClass(action: string): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    if (action.includes('CREATE')) return `${base} bg-green-100 text-green-800`;
    if (action.includes('UPDATE')) return `${base} bg-yellow-100 text-yellow-800`;
    if (action.includes('DELETE')) return `${base} bg-red-100 text-red-800`;
    if (action.includes('APPROVE')) return `${base} bg-emerald-100 text-emerald-800`;
    if (action.includes('REJECT')) return `${base} bg-rose-100 text-rose-800`;
    return `${base} bg-gray-100 text-gray-800`;
  }
}
