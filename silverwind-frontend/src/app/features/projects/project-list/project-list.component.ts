import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { Organization } from '../../../core/models/auth.model';
import { OrganizationService } from '../../../core/services/organization.service';
import { FormsModule } from '@angular/forms';
import { HeaderService } from '../../../core/services/header.service';
import { OrganizationLogoComponent } from '../../../shared/components/organization-logo/organization-logo.component';
import { NotificationService } from '../../../core/services/notification.service';
import { AddProjectModalComponent } from '../components/add-project-modal/add-project-modal.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    OrganizationLogoComponent,
    UserAvatarComponent,
    AddProjectModalComponent,
  ],
  template: `
    <div class="space-y-6 md:space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div></div>
        <button
          (click)="showCreateModal = true"
          class="btn-primary inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold"
        >
          <i class="bi bi-plus-lg mr-2"></i> New Project
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="stat-card" [style.background]="getProjectGradient('ACTIVE')">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-white/90">Active</p>
              <p class="text-2xl font-bold text-white">{{ getStatusCount('ACTIVE') }}</p>
            </div>
            <div class="p-3 rounded-xl bg-white/20 backdrop-blur-sm text-white">
              <i class="bi bi-play-circle-fill text-xl"></i>
            </div>
          </div>
        </div>
        <div class="stat-card" [style.background]="getProjectGradient('PLANNED')">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-white/90">Planned</p>
              <p class="text-2xl font-bold text-white">{{ getStatusCount('PLANNED') }}</p>
            </div>
            <div class="p-3 rounded-xl bg-white/20 backdrop-blur-sm text-white">
              <i class="bi bi-calendar-check-fill text-xl"></i>
            </div>
          </div>
        </div>
        <div class="stat-card" [style.background]="getProjectGradient('ON_HOLD')">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-white/90">On Hold</p>
              <p class="text-2xl font-bold text-white">{{ getStatusCount('ON_HOLD') }}</p>
            </div>
            <div class="p-3 rounded-xl bg-white/20 backdrop-blur-sm text-white">
              <i class="bi bi-pause-circle-fill text-xl"></i>
            </div>
          </div>
        </div>
        <div class="stat-card" [style.background]="getProjectGradient('COMPLETED')">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-white/90">Completed</p>
              <p class="text-2xl font-bold text-white">{{ getStatusCount('COMPLETED') }}</p>
            </div>
            <div class="p-3 rounded-xl bg-white/20 backdrop-blur-sm text-white">
              <i class="bi bi-check-circle-fill text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Search & Filter -->
      <div class="card-modern p-4 flex flex-col md:flex-row gap-4">
        <div class="relative flex-1">
          <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search projects..."
            class="input-modern pl-11"
          />
        </div>
        <select
          [(ngModel)]="statusFilter"
          class="px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PLANNED">Planned</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <!-- Project Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <a
          *ngFor="let project of filteredProjects(); let i = index"
          [routerLink]="['/projects', project.id]"
          class="card-modern p-6 group cursor-pointer animate-fade-in-up relative"
          [ngClass]="hasNotification(project.id) ? 'ring-2 ring-red-200 border-red-300' : ''"
          [style.animation-delay.ms]="i * 50"
        >
          <!-- Notification Indicator -->
          <div *ngIf="hasNotification(project.id)" class="absolute top-3 right-3 z-10">
            <span class="flex h-3 w-3">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
              ></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
          <!-- Card Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <app-organization-logo
                [org]="project.client || project.internalOrg"
                [orgId]="project.client?.id || project.internalOrg?.id"
                size="md"
                [rounded]="true"
              ></app-organization-logo>
              <div>
                <h3 class="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {{ project.name }}
                </h3>
                <span class="badge text-xs" [ngClass]="getStatusBadgeClass(project.status)">{{
                  project.status
                }}</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <p class="text-sm text-gray-500 line-clamp-2 mb-4">
            {{ project.description || 'No description provided' }}
          </p>

          <!-- Info -->
          <div class="space-y-2 mb-4">
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <i class="bi bi-building text-gray-400"></i>
              <span>{{ project.client?.name || 'Internal Project' }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <i class="bi bi-calendar text-gray-400"></i>
              <span
                >{{ project.startDate | date: 'mediumDate' }} -
                {{ project.endDate ? (project.endDate | date: 'mediumDate') : 'Ongoing' }}</span
              >
            </div>
          </div>

          <!-- Footer -->
          <div class="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div class="flex -space-x-2">
              <ng-container *ngIf="project.allocations && project.allocations.length > 0">
                <div
                  *ngFor="let allocation of project.allocations.slice(0, 3)"
                  class="w-8 h-8 rounded-full border-2 border-white relative group/avatar"
                  [title]="allocation.user.firstName + ' ' + allocation.user.lastName"
                >
                  <app-user-avatar [user]="allocation.user"></app-user-avatar>
                </div>
                <div
                  *ngIf="project.allocations.length > 3"
                  class="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-bold"
                >
                  +{{ project.allocations.length - 3 }}
                </div>
              </ng-container>
              <div
                *ngIf="!project.allocations || project.allocations.length === 0"
                class="text-xs text-gray-400 italic py-1"
              >
                No team
              </div>
            </div>
            <span
              class="text-sm font-medium text-indigo-600 group-hover:text-indigo-800 flex items-center"
            >
              View
              <i class="bi bi-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
            </span>
          </div>
        </a>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredProjects().length === 0" class="card-modern p-12 text-center">
        <div
          class="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <i class="bi bi-kanban text-3xl text-gray-400"></i>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">No projects found</h3>
        <p class="text-gray-500 mb-6">
          {{
            searchQuery || statusFilter
              ? 'Try adjusting your filters'
              : 'Start by creating a new project'
          }}
        </p>
        <button
          (click)="showCreateModal = true; searchQuery = ''; statusFilter = ''"
          class="btn-primary px-6 py-3 rounded-xl font-semibold"
        >
          <i class="bi bi-plus-lg mr-2"></i> Create Project
        </button>
      </div>

      <!-- Add Project Modal -->
      <app-add-project-modal
        [isOpen]="showCreateModal"
        [clients]="clients()"
        (close)="showCreateModal = false"
        (saved)="loadProjects()"
      ></app-add-project-modal>
    </div>
  `,
})
export class ProjectListComponent implements OnInit {
  projectService = inject(ProjectService);
  orgService = inject(OrganizationService);
  headerService = inject(HeaderService);
  private notificationService = inject(NotificationService);

  projects = signal<Project[]>([]);
  clients = signal<Organization[]>([]);
  unreadProjectIds = new Set<string>();
  showCreateModal = false;
  searchQuery = '';
  statusFilter = '';

  ngOnInit() {
    this.headerService.setTitle(
      'Projects',
      'Manage client and internal projects',
      'bi bi-kanban-fill',
    );
    this.loadUnreadProjectIds();
    this.loadProjects();
    this.loadClients();
  }

  loadUnreadProjectIds() {
    this.notificationService.getUnreadEntityIds('PROJECT').subscribe({
      next: (ids) => (this.unreadProjectIds = new Set(ids)),
      error: () => (this.unreadProjectIds = new Set()),
    });
  }

  hasNotification(projectId: string): boolean {
    return this.unreadProjectIds.has(projectId);
  }

  loadProjects() {
    this.projectService.getProjects().subscribe((data) => {
      this.projects.set(data);
    });
  }

  loadClients() {
    this.orgService.getApprovedOrganizations().subscribe((data) => {
      // Filter for CLIENT or VENDOR if needed, or allow all
      this.clients.set(data);
    });
  }

  filteredProjects(): Project[] {
    let result = this.projects();

    if (this.statusFilter) {
      result = result.filter((p) => p.status === this.statusFilter);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.client?.name?.toLowerCase().includes(query),
      );
    }

    // Sort: notified projects first, then by name
    result = [...result].sort((a, b) => {
      const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
      const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
      if (bHasNotif !== aHasNotif) return bHasNotif - aHasNotif;
      return a.name.localeCompare(b.name);
    });

    return result;
  }

  getStatusCount(status: string): number {
    return this.projects().filter((p) => p.status === status).length;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'badge-success';
      case 'PLANNED':
        return 'badge-info';
      case 'ON_HOLD':
        return 'badge-warning';
      case 'COMPLETED':
        return 'badge-primary';
      default:
        return 'badge-primary';
    }
  }

  getProjectGradient(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'linear-gradient(to bottom right, #10b981, #059669)'; // Emerald
      case 'PLANNED':
        return 'linear-gradient(to bottom right, #3b82f6, #2563eb)'; // Blue
      case 'ON_HOLD':
        return 'linear-gradient(to bottom right, #f59e0b, #d97706)'; // Amber
      case 'COMPLETED':
        return 'linear-gradient(to bottom right, #6366f1, #4f46e5)'; // Indigo (Primary)
      default:
        return 'linear-gradient(to bottom right, #64748b, #475569)'; // Slate
    }
  }
}
