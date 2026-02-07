import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { ProjectService, UpdateStatusRequest } from '../../../core/services/project.service';
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
          (click)="openCreateModal()"
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
        <div
          *ngFor="let project of filteredProjects(); let i = index"
          class="card-modern p-6 group animate-fade-in-up relative"
          [ngClass]="hasNotification(project.id) ? 'ring-2 ring-red-200 border-red-300' : ''"
          [style.animation-delay.ms]="i * 50"
        >
          <!-- Notification Indicator -->
          <div *ngIf="hasNotification(project.id)" class="absolute top-3 right-12 z-10">
            <span class="flex h-3 w-3">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
              ></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>

          <!-- Action Menu -->
          <div class="absolute top-3 right-3 z-20">
            <div class="relative">
              <button
                (click)="toggleMenu(project.id); $event.stopPropagation()"
                class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i class="bi bi-three-dots-vertical"></i>
              </button>
              <div
                *ngIf="activeMenuId === project.id"
                class="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30"
              >
                <a
                  [routerLink]="['/projects', project.id]"
                  class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <i class="bi bi-eye mr-3 text-gray-400"></i> View Details
                </a>
                <button
                  (click)="openEditModal(project); $event.stopPropagation()"
                  class="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <i class="bi bi-pencil mr-3 text-gray-400"></i> Edit Project
                </button>
                <div class="border-t border-gray-100 my-1"></div>
                <div class="px-4 py-2 text-xs font-medium text-gray-400 uppercase">
                  Change Status
                </div>
                <button
                  *ngFor="let status of statuses"
                  (click)="changeStatus(project, status); $event.stopPropagation()"
                  [disabled]="project.status === status"
                  class="w-full flex items-center px-4 py-2 text-sm hover:bg-gray-50"
                  [class.text-gray-400]="project.status === status"
                  [class.text-gray-700]="project.status !== status"
                >
                  <i class="bi mr-3" [ngClass]="getStatusIcon(status)"></i>
                  {{ formatStatus(status) }}
                </button>
                <div class="border-t border-gray-100 my-1"></div>
                <button
                  (click)="confirmDelete(project); $event.stopPropagation()"
                  class="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <i class="bi bi-trash3 mr-3"></i> Delete Project
                </button>
              </div>
            </div>
          </div>

          <!-- Card Content - Clickable -->
          <a [routerLink]="['/projects', project.id]" class="block cursor-pointer">
            <!-- Card Header -->
            <div class="flex items-start justify-between mb-4 pr-8">
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
                  <span class="badge text-xs" [ngClass]="getStatusBadgeClass(project.status)">
                    {{ project.status }}
                  </span>
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
                    class="w-8 h-8 rounded-full border-2 border-white relative"
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
                <i
                  class="bi bi-arrow-right ml-1 group-hover:translate-x-1 transition-transform"
                ></i>
              </span>
            </div>
          </a>
        </div>
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
          (click)="openCreateModal(); searchQuery = ''; statusFilter = ''"
          class="btn-primary px-6 py-3 rounded-xl font-semibold"
        >
          <i class="bi bi-plus-lg mr-2"></i> Create Project
        </button>
      </div>

      <!-- Add/Edit Project Modal -->
      <app-add-project-modal
        [isOpen]="showCreateModal"
        [clients]="clients()"
        [editProject]="projectToEdit"
        (close)="closeModal()"
        (saved)="loadProjects()"
      ></app-add-project-modal>

      <!-- Delete Confirmation Modal -->
      <div
        *ngIf="showDeleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <i class="bi bi-exclamation-triangle text-2xl text-red-600"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Delete Project?</h3>
              <p class="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
          </div>
          <p class="text-gray-600 mb-6">
            Are you sure you want to delete <strong>{{ projectToDelete?.name }}</strong
            >? All allocations will also be removed.
          </p>
          <div class="flex gap-3 justify-end">
            <button
              (click)="showDeleteConfirm = false; projectToDelete = null"
              class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              (click)="deleteProject()"
              [disabled]="deleting"
              class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50"
            >
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes scale-in {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      .animate-scale-in {
        animation: scale-in 0.2s ease-out;
      }
    `,
  ],
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
  projectToEdit: Project | null = null;
  showDeleteConfirm = false;
  projectToDelete: Project | null = null;
  deleting = false;
  activeMenuId: string | null = null;

  searchQuery = '';
  statusFilter = '';
  statuses: ('ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNED')[] = [
    'ACTIVE',
    'PLANNED',
    'ON_HOLD',
    'COMPLETED',
  ];

  ngOnInit() {
    this.headerService.setTitle(
      'Projects',
      'Manage client and internal projects',
      'bi bi-kanban-fill',
    );
    this.loadUnreadProjectIds();
    this.loadProjects();
    this.loadClients();

    // Close menu when clicking outside
    document.addEventListener('click', () => (this.activeMenuId = null));
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

    result = [...result].sort((a, b) => {
      const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
      const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
      if (bHasNotif !== aHasNotif) return bHasNotif - aHasNotif;
      return a.name.localeCompare(b.name);
    });

    return result;
  }

  // ========== ACTIONS ==========

  toggleMenu(projectId: string) {
    this.activeMenuId = this.activeMenuId === projectId ? null : projectId;
  }

  openCreateModal() {
    this.projectToEdit = null;
    this.showCreateModal = true;
    this.activeMenuId = null;
  }

  openEditModal(project: Project) {
    this.projectToEdit = project;
    this.showCreateModal = true;
    this.activeMenuId = null;
  }

  closeModal() {
    this.showCreateModal = false;
    this.projectToEdit = null;
  }

  changeStatus(project: Project, status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'PLANNED') {
    this.activeMenuId = null;
    if (project.status === status) return;

    this.projectService.updateStatus(project.id, { status }).subscribe({
      next: () => this.loadProjects(),
      error: (err) => console.error('Failed to update status', err),
    });
  }

  confirmDelete(project: Project) {
    this.projectToDelete = project;
    this.showDeleteConfirm = true;
    this.activeMenuId = null;
  }

  deleteProject() {
    if (!this.projectToDelete) return;
    this.deleting = true;

    this.projectService.deleteProject(this.projectToDelete.id).subscribe({
      next: () => {
        this.loadProjects();
        this.showDeleteConfirm = false;
        this.projectToDelete = null;
        this.deleting = false;
      },
      error: (err) => {
        console.error('Failed to delete project', err);
        this.deleting = false;
      },
    });
  }

  // ========== HELPERS ==========

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

  getStatusIcon(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bi-play-circle text-green-500';
      case 'PLANNED':
        return 'bi-calendar-check text-blue-500';
      case 'ON_HOLD':
        return 'bi-pause-circle text-amber-500';
      case 'COMPLETED':
        return 'bi-check-circle text-indigo-500';
      default:
        return 'bi-circle';
    }
  }

  formatStatus(status: string): string {
    return status
      .replace('_', ' ')
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  getProjectGradient(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'linear-gradient(to bottom right, #10b981, #059669)';
      case 'PLANNED':
        return 'linear-gradient(to bottom right, #3b82f6, #2563eb)';
      case 'ON_HOLD':
        return 'linear-gradient(to bottom right, #f59e0b, #d97706)';
      case 'COMPLETED':
        return 'linear-gradient(to bottom right, #6366f1, #4f46e5)';
      default:
        return 'linear-gradient(to bottom right, #64748b, #475569)';
    }
  }
}
