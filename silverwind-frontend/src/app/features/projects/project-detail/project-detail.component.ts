import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { HeaderService } from '../../../core/services/header.service';
import { Project, ProjectAllocation, UserSummary } from '../../../core/models/project.model';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/auth.model';
import { OrganizationLogoComponent } from '../../../shared/components/organization-logo/organization-logo.component';
import { AllocateResourceModalComponent } from '../components/allocate-resource-modal/allocate-resource-modal.component';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { CandidateService } from '../../../core/services/candidate.service';
import { Candidate } from '../../../core/models/candidate.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    OrganizationLogoComponent,
    AllocateResourceModalComponent,
    UserAvatarComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- ... (Header and Stats Cards unchanged) ... -->
      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <a
            routerLink="/projects"
            class="text-indigo-600 hover:underline text-sm mb-2 flex items-center"
          >
            <i class="bi bi-arrow-left mr-1"></i> Back to Projects
          </a>
          <!-- ... Project Title/Logo ... -->
          <div class="flex items-center gap-3 mt-2">
            <app-organization-logo
              [org]="project()?.client || project()?.internalOrg"
              [orgId]="project()?.client?.id || project()?.internalOrg?.id"
              size="lg"
              [rounded]="true"
            ></app-organization-logo>
            <div>
              <h2 class="text-3xl font-bold text-gray-900">{{ project()?.name }}</h2>
              <div class="flex items-center gap-2 mt-1">
                <span
                  class="px-3 py-1 text-sm font-medium rounded-full"
                  [ngClass]="{
                    'bg-green-100 text-green-800': project()?.status === 'ACTIVE',
                    'bg-gray-100 text-gray-800': project()?.status === 'COMPLETED',
                    'bg-yellow-100 text-yellow-800': project()?.status === 'ON_HOLD',
                    'bg-blue-100 text-blue-800': project()?.status === 'PLANNED',
                  }"
                >
                  {{ project()?.status }}
                </span>
                <span class="text-sm text-gray-500">
                  {{ project()?.client?.name || 'Internal Project' }}
                </span>
              </div>
            </div>
          </div>
          <p class="text-gray-500 mt-3 max-w-2xl">{{ project()?.description }}</p>
        </div>
        <button
          (click)="showAllocateModal = true"
          class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm font-medium transition-colors"
        >
          <i class="bi bi-person-plus mr-2"></i> Allocate Resource
        </button>
      </div>

      <!-- Stats Cards (unchanged) -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- ... stats ... -->
        <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <i class="bi bi-people text-indigo-600"></i>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ allocations().length }}</p>
              <p class="text-xs text-gray-500">Team Members</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <i class="bi bi-graph-up text-green-600"></i>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ totalAllocation() }}%</p>
              <p class="text-xs text-gray-500">Total Capacity</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <i class="bi bi-calendar-range text-amber-600"></i>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ projectDuration() }}</p>
              <p class="text-xs text-gray-500">Duration</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <i class="bi bi-pie-chart text-purple-600"></i>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ avgAllocation() }}%</p>
              <p class="text-xs text-gray-500">Avg Allocation</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Team Allocation Chart -->
        <div
          class="lg:col-span-1 bg-white rounded-xl p-6 border border-gray-100 shadow-sm overflow-visible"
        >
          <!-- ... chart header ... -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Allocation Breakdown</h3>
            <!-- ... tooltip ... -->
          </div>

          <div *ngIf="allocations().length > 0" class="flex flex-col items-center">
            <!-- Donut Chart -->
            <div class="relative w-48 h-48 mb-4">
              <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
                <ng-container *ngFor="let segment of chartSegments(); let i = index">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    [attr.stroke]="segment.color"
                    stroke-width="15"
                    [attr.stroke-dasharray]="segment.dashArray"
                    [attr.stroke-dashoffset]="segment.offset"
                    class="transition-all duration-500"
                  />
                </ng-container>
                <circle cx="50" cy="50" r="32" fill="white" />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-bold text-gray-900">{{ allocations().length }}</span>
                <span class="text-xs text-gray-500">Resources</span>
              </div>
            </div>

            <!-- Legend -->
            <div class="w-full space-y-2">
              <div *ngFor="let alloc of allocations()" class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full" [style.background]="getColor(alloc)"></div>
                  <span class="text-sm text-gray-700"
                    >{{ (alloc.user || alloc.candidateDetails)?.firstName }}
                    {{ (alloc.user || alloc.candidateDetails)?.lastName?.charAt(0) }}.</span
                  >
                </div>
                <span class="text-sm font-medium text-gray-900"
                  >{{ alloc.allocationPercentage }}%</span
                >
              </div>
            </div>
          </div>

          <div *ngIf="allocations().length === 0" class="text-center py-8 text-gray-400">
            <i class="bi bi-pie-chart text-4xl mb-2"></i>
            <p>No allocations yet</p>
          </div>
        </div>

        <!-- Team Table -->
        <div
          class="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">Resource Team</h3>
            <span class="text-sm text-gray-500">{{ allocations().length }} members</span>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-100">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Resource
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Allocation
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Period
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr *ngFor="let alloc of allocations()" class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9">
                        <ng-container *ngIf="alloc.user">
                          <app-user-avatar [user]="alloc.user"></app-user-avatar>
                        </ng-container>
                        <div
                          *ngIf="alloc.candidateDetails && !alloc.user"
                          class="w-full h-full rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold"
                        >
                          {{ alloc.candidateDetails.firstName.charAt(0)
                          }}{{ alloc.candidateDetails.lastName.charAt(0) }}
                        </div>
                      </div>
                      <div>
                        <div class="font-medium text-gray-900">
                          {{ (alloc.user || alloc.candidateDetails)?.firstName }}
                          {{ (alloc.user || alloc.candidateDetails)?.lastName }}
                          <span
                            *ngIf="alloc.candidateDetails"
                            class="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full"
                            >Ext</span
                          >
                        </div>
                        <div class="text-sm text-gray-500">
                          {{ (alloc.user || alloc.candidateDetails)?.email }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-sm text-gray-700 font-medium">{{
                      alloc.billingRole || 'N/A'
                    }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 bg-gray-200 rounded-full h-2 w-20">
                        <div
                          class="bg-indigo-600 h-2 rounded-full"
                          [style.width.%]="alloc.allocationPercentage"
                        ></div>
                      </div>
                      <span class="text-sm font-medium text-gray-700"
                        >{{ alloc.allocationPercentage }}%</span
                      >
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    {{ alloc.startDate | date: 'MMM d, y' }} -
                    {{ alloc.endDate ? (alloc.endDate | date: 'MMM d, y') : 'Ongoing' }}
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full"
                      [ngClass]="{
                        'bg-green-100 text-green-800': alloc.status === 'ACTIVE',
                        'bg-gray-100 text-gray-600': alloc.status === 'ENDED',
                        'bg-blue-100 text-blue-800': alloc.status === 'PLANNED',
                      }"
                    >
                      {{ alloc.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button
                      (click)="confirmDeallocate(alloc)"
                      class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Remove from project"
                    >
                      <i class="bi bi-person-dash"></i>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="allocations().length === 0">
                  <td colspan="6" class="px-6 py-12 text-center text-gray-400">
                    <i class="bi bi-people text-4xl mb-2"></i>
                    <p>No resources allocated yet</p>
                    <button
                      (click)="showAllocateModal = true"
                      class="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Allocate someone now
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Timeline Section (unchanged logic just need to handle user/candidate name) -->
      <div
        *ngIf="allocations().length > 0"
        class="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
      >
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Allocation Timeline</h3>
        <div class="space-y-3">
          <div *ngFor="let alloc of allocations()" class="flex items-center gap-4">
            <div class="w-32 text-sm text-gray-600 truncate">
              {{ (alloc.user || alloc.candidateDetails)?.firstName }}
              {{ (alloc.user || alloc.candidateDetails)?.lastName?.charAt(0) }}.
            </div>
            <div class="flex-1 h-8 bg-gray-100 rounded-lg relative overflow-hidden">
              <div
                class="absolute h-full rounded-lg flex items-center justify-center text-xs text-white font-medium"
                [style.left.%]="getTimelineOffset(alloc)"
                [style.width.%]="getTimelineWidth(alloc)"
                [style.background]="getColor(alloc)"
              >
                {{ alloc.allocationPercentage }}%
              </div>
            </div>
          </div>
        </div>
        <div class="flex justify-between mt-2 text-xs text-gray-400">
          <span>{{ project()?.startDate | date: 'MMM d' }}</span>
          <span>{{ project()?.endDate ? (project()?.endDate | date: 'MMM d') : 'Ongoing' }}</span>
        </div>
      </div>

      <!-- Allocate Resource Modal -->
      <app-allocate-resource-modal
        [isOpen]="showAllocateModal"
        [projectId]="project()?.id || null"
        [users]="users()"
        [candidates]="candidates()"
        (close)="showAllocateModal = false"
        (saved)="loadAllocations(project()!.id)"
      ></app-allocate-resource-modal>

      <!-- Deallocate Confirmation -->
      <div
        *ngIf="showDeallocateConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <i class="bi bi-person-dash text-2xl text-red-600"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Remove Team Member?</h3>
              <p class="text-sm text-gray-500">This will remove the allocation.</p>
            </div>
          </div>
          <p class="text-gray-600 mb-6">
            Remove
            <strong
              >{{ (allocationToRemove?.user || allocationToRemove?.candidateDetails)?.firstName }}
              {{
                (allocationToRemove?.user || allocationToRemove?.candidateDetails)?.lastName
              }}</strong
            >
            from this project?
          </p>
          <div class="flex gap-3 justify-end">
            <button
              (click)="showDeallocateConfirm = false; allocationToRemove = null"
              class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              (click)="deallocate()"
              [disabled]="deallocating"
              class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50"
            >
              {{ deallocating ? 'Removing...' : 'Remove' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private candidateService = inject(CandidateService);
  private headerService = inject(HeaderService);

  project = signal<Project | null>(null);
  allocations = signal<ProjectAllocation[]>([]);
  users = signal<User[]>([]);
  candidates = signal<Candidate[]>([]);

  showAllocateModal = false;
  showDeallocateConfirm = false;
  allocationToRemove: ProjectAllocation | null = null;
  deallocating = false;

  private colors = [
    '#6366f1',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#14b8a6',
    '#f97316',
    '#ec4899',
  ];

  // Computed values
  totalAllocation = computed(() =>
    this.allocations().reduce((sum, a) => sum + a.allocationPercentage, 0),
  );
  avgAllocation = computed(() => {
    const allocs = this.allocations();
    return allocs.length ? Math.round(this.totalAllocation() / allocs.length) : 0;
  });

  projectDuration = computed(() => {
    const p = this.project();
    if (!p?.startDate) return 'N/A';
    const start = new Date(p.startDate);
    const end = p.endDate ? new Date(p.endDate) : new Date();
    const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return months <= 1 ? '1 mo' : `${months} mo`;
  });

  chartSegments = computed(() => {
    const allocs = this.allocations();
    if (!allocs.length) return [];

    const total = this.totalAllocation();
    const circumference = 2 * Math.PI * 40;
    let offset = 0;

    return allocs.map((alloc, i) => {
      const percentage = alloc.allocationPercentage / total;
      const dashLength = circumference * percentage;
      const dashArray = `${dashLength} ${circumference - dashLength}`;
      const segment = {
        color: this.colors[i % this.colors.length],
        dashArray,
        offset: -offset,
      };
      offset += dashLength;
      return segment;
    });
  });

  ngOnInit() {
    this.headerService.setTitle(
      'Project Details',
      'View project information and allocations',
      'bi bi-kanban',
    );
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.loadProject(projectId);
      this.loadAllocations(projectId);
    }
    this.loadUsers();
    this.loadCandidates();
  }

  loadProject(id: string) {
    this.projectService.getProject(id).subscribe((p) => {
      this.project.set(p);
    });
  }

  loadAllocations(id: string) {
    this.projectService.getAllocations(id).subscribe((data) => {
      this.allocations.set(data);
    });
  }

  loadUsers() {
    this.userService.getUsers(0, 100).subscribe((page) => {
      this.users.set(page.content);
    });
  }

  loadCandidates() {
    this.candidateService.getAllCandidates().subscribe((data) => {
      this.candidates.set(data);
    });
  }

  getColor(alloc: ProjectAllocation): string {
    const index = this.allocations().indexOf(alloc);
    return this.colors[index % this.colors.length];
  }

  getTimelineOffset(alloc: ProjectAllocation): number {
    const p = this.project();
    if (!p?.startDate || !alloc.startDate) return 0;
    const projectStart = new Date(p.startDate).getTime();
    const projectEnd = p.endDate ? new Date(p.endDate).getTime() : Date.now();
    const allocStart = new Date(alloc.startDate).getTime();
    return ((allocStart - projectStart) / (projectEnd - projectStart)) * 100;
  }

  getTimelineWidth(alloc: ProjectAllocation): number {
    const p = this.project();
    if (!p?.startDate || !alloc.startDate) return 0;
    const projectStart = new Date(p.startDate).getTime();
    const projectEnd = p.endDate ? new Date(p.endDate).getTime() : Date.now();
    const allocStart = new Date(alloc.startDate).getTime();
    const allocEnd = alloc.endDate ? new Date(alloc.endDate).getTime() : projectEnd;
    return Math.min(100, ((allocEnd - allocStart) / (projectEnd - projectStart)) * 100);
  }

  confirmDeallocate(alloc: ProjectAllocation) {
    this.allocationToRemove = alloc;
    this.showDeallocateConfirm = true;
  }

  deallocate() {
    if (!this.allocationToRemove || !this.project()) return;
    this.deallocating = true;

    this.projectService.deallocateUser(this.project()!.id, this.allocationToRemove.id).subscribe({
      next: () => {
        this.loadAllocations(this.project()!.id);
        this.showDeallocateConfirm = false;
        this.allocationToRemove = null;
        this.deallocating = false;
      },
      error: (err) => {
        console.error('Failed to deallocate', err);
        this.deallocating = false;
      },
    });
  }
}
