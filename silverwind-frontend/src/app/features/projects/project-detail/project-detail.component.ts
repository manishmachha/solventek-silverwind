import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/services/project.service';
import { HeaderService } from '../../../core/services/header.service';
import { Project, ProjectAllocation } from '../../../core/models/project.model';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/auth.model';
import { OrganizationLogoComponent } from '../../../shared/components/organization-logo/organization-logo.component';
import { AllocateResourceModalComponent } from '../components/allocate-resource-modal/allocate-resource-modal.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, OrganizationLogoComponent, AllocateResourceModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Header Section -->
      <div class="flex items-center justify-between">
        <div>
          <a
            routerLink="/projects"
            class="text-indigo-600 hover:underline text-sm mb-2 flex items-center"
          >
            <i class="bi bi-arrow-left mr-1"></i> Back to Projects
          </a>
          <div class="flex items-center gap-3">
            <app-organization-logo
              [org]="project()?.client || project()?.internalOrg"
              [orgId]="project()?.client?.id || project()?.internalOrg?.id"
              size="md"
              [rounded]="true"
            ></app-organization-logo>
            <h2 class="text-3xl font-bold text-gray-900">{{ project()?.name }}</h2>
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
          </div>
          <p class="text-gray-500 mt-1 max-w-2xl">{{ project()?.description }}</p>
        </div>
        <button
          (click)="showAllocateModal = true"
          class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm font-medium transition-colors"
        >
          <i class="bi bi-person-plus mr-2"></i> Allocate Resource
        </button>
      </div>

      <!-- Tabs Navigation -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            *ngFor="let tab of tabs"
            (click)="activeTab.set(tab.id)"
            [class.border-indigo-500]="activeTab() === tab.id"
            [class.text-indigo-600]="activeTab() === tab.id"
            [class.border-transparent]="activeTab() !== tab.id"
            [class.text-gray-500]="activeTab() !== tab.id"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-gray-700 hover:border-gray-300 transition-colors"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Tab Content Area -->
      <div class="min-h-[400px]">
        <!-- Tab: Overview -->
        <div *ngIf="activeTab() === 'overview'" class="space-y-6 animate-fade-in">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Key Dates Card -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <i class="bi bi-calendar-event mr-2 text-indigo-500"></i> Timeline
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >Start Date</label
                  >
                  <p class="text-gray-900 font-medium">
                    {{ project()?.startDate | date: 'mediumDate' }}
                  </p>
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >End Date</label
                  >
                  <p class="text-gray-900 font-medium">
                    {{ (project()?.endDate | date: 'mediumDate') || 'Ongoing' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Client Summary Card -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <i class="bi bi-building mr-2 text-indigo-500"></i> Client
              </h3>
              <div *ngIf="project()?.client as client">
                <div class="flex items-center gap-3 mb-2">
                  <app-organization-logo
                    [org]="client"
                    [orgId]="client.id"
                    size="sm"
                    [rounded]="true"
                  ></app-organization-logo>
                  <p class="text-xl font-bold text-gray-800 mb-0">{{ client.name }}</p>
                </div>
                <p class="text-sm text-gray-500 mb-3">{{ client.industry }}</p>
                <div class="text-sm">
                  <div class="flex items-center text-gray-600 mb-2">
                    <i class="bi bi-geo-alt mr-2 text-gray-400"></i> {{ client.city }},
                    {{ client.country }}
                  </div>
                  <div class="flex items-center text-gray-600">
                    <i class="bi bi-globe mr-2 text-gray-400"></i>
                    <a
                      [href]="'https://' + client.website"
                      target="_blank"
                      class="text-indigo-600 hover:underline"
                      >{{ client.website }}</a
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Internal Org Summary Card -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <i class="bi bi-diagram-3 mr-2 text-indigo-500"></i> Managed By
              </h3>
              <div *ngIf="project()?.internalOrg as org">
                <div class="flex items-center gap-3 mb-2">
                  <app-organization-logo
                    [org]="org"
                    [orgId]="org.id"
                    size="sm"
                    [rounded]="true"
                  ></app-organization-logo>
                  <p class="text-xl font-bold text-gray-800 mb-0">{{ org.name }}</p>
                </div>
                <p class="text-sm text-gray-500 mb-3">{{ org.type }}</p>
                <div class="text-sm">
                  <div class="flex items-center text-gray-600 mb-2">
                    <i class="bi bi-people mr-2 text-gray-400"></i>
                    {{ org.employeeCount }} Employees
                  </div>
                  <div class="flex items-center text-gray-600">
                    <i class="bi bi-envelope mr-2 text-gray-400"></i> {{ org.email }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Client Details -->
        <div *ngIf="activeTab() === 'client'" class="animate-fade-in">
          <ng-container
            *ngTemplateOutlet="orgDetailTemplate; context: { $implicit: project()?.client }"
          ></ng-container>
        </div>

        <!-- Tab: Internal Org Details -->
        <div *ngIf="activeTab() === 'internal'" class="animate-fade-in">
          <ng-container
            *ngTemplateOutlet="orgDetailTemplate; context: { $implicit: project()?.internalOrg }"
          ></ng-container>
        </div>

        <!-- Tab: Allocations -->
        <div *ngIf="activeTab() === 'allocations'" class="animate-fade-in">
          <div class="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
            <div
              class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center"
            >
              <h3 class="text-lg font-medium text-gray-900">Resource Team</h3>
              <span class="text-sm text-gray-500">{{ allocations().length }} Members</span>
            </div>
            <table class="min-w-full divide-y divide-gray-200">
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
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let alloc of allocations()" class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div
                        class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3"
                      >
                        {{ alloc.user.firstName.charAt(0) }}{{ alloc.user.lastName.charAt(0) }}
                      </div>
                      <div>
                        <div class="text-sm font-medium text-gray-900">
                          {{ alloc.user.firstName }} {{ alloc.user.lastName }}
                        </div>
                        <div class="text-sm text-gray-500">{{ alloc.user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                    {{ alloc.billingRole || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex items-center">
                      <div class="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div
                          class="bg-indigo-600 h-1.5 rounded-full"
                          [style.width.%]="alloc.allocationPercentage"
                        ></div>
                      </div>
                      <span>{{ alloc.allocationPercentage }}%</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ alloc.startDate | date: 'MMM d, y' }} -
                    {{ (alloc.endDate | date: 'MMM d, y') || 'Ongoing' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2 py-1 text-xs font-medium rounded-full"
                      [ngClass]="{
                        'bg-green-100 text-green-800': alloc.status === 'ACTIVE',
                        'bg-gray-100 text-gray-800': alloc.status === 'ENDED',
                        'bg-blue-100 text-blue-800': alloc.status === 'PLANNED',
                      }"
                    >
                      {{ alloc.status }}
                    </span>
                  </td>
                </tr>
                <tr *ngIf="allocations().length === 0">
                  <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                      <i class="bi bi-people text-4xl mb-3 text-gray-300"></i>
                      <p>No resources allocated yet.</p>
                      <button
                        (click)="showAllocateModal = true"
                        class="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        Allocate someone now
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Reusable Template for Organization Details -->
    <ng-template #orgDetailTemplate let-org>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" *ngIf="org">
        <!-- Main Info Card -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="flex items-start justify-between mb-6">
              <div class="flex gap-4">
                <app-organization-logo
                  [org]="org"
                  [orgId]="org.id"
                  size="xl"
                  [rounded]="true"
                ></app-organization-logo>
                <div>
                  <h3 class="text-2xl font-bold text-gray-900">{{ org.legalName || org.name }}</h3>
                  <p class="text-gray-500">{{ org.industry }} • {{ org.type }}</p>
                </div>
              </div>
              <span
                *ngIf="org.status"
                class="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200"
              >
                {{ org.status }}
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1"
                  >Company Website</label
                >
                <a
                  [href]="'https://' + org.website"
                  target="_blank"
                  class="text-indigo-600 hover:underline flex items-center"
                >
                  {{ org.website || 'N/A' }} <i class="bi bi-box-arrow-up-right ml-2 text-xs"></i>
                </a>
              </div>
              <div>
                <label class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1"
                  >Email</label
                >
                <span class="text-gray-700">{{ org.email || 'N/A' }}</span>
              </div>
              <div>
                <label class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1"
                  >Phone</label
                >
                <span class="text-gray-700">{{ org.phone || 'N/A' }}</span>
              </div>
              <div>
                <label class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1"
                  >Tax ID</label
                >
                <span class="text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded">{{
                  org.taxId || 'N/A'
                }}</span>
              </div>
              <div class="col-span-full">
                <label class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1"
                  >Service Offerings</label
                >
                <div class="flex flex-wrap gap-2">
                  <span
                    *ngFor="let service of org.serviceOfferings?.split(',') || []"
                    class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md border border-gray-200"
                  >
                    {{ service.trim() }}
                  </span>
                  <span *ngIf="!org.serviceOfferings" class="text-gray-400 italic"
                    >No services listed</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Address Card -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 class="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
              Location
            </h4>
            <div class="flex items-start">
              <i class="bi bi-geo-alt text-2xl text-indigo-500 mr-4 mt-1"></i>
              <div class="text-gray-700">
                <p class="font-medium">{{ org.addressLine1 }}</p>
                <p *ngIf="org.addressLine2">{{ org.addressLine2 }}</p>
                <p>{{ org.city }}, {{ org.state }} {{ org.postalCode }}</p>
                <p class="font-bold mt-1 text-gray-900">{{ org.country }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Info -->
        <div class="space-y-6">
          <!-- Stats Card -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
              At a Glance
            </h4>
            <div class="space-y-4">
              <div class="flex justify-between items-center py-2 border-b border-gray-50">
                <span class="text-gray-600">Employees</span>
                <span class="font-bold text-gray-900">{{ org.employeeCount | number }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-50">
                <span class="text-gray-600">Years Active</span>
                <span class="font-bold text-gray-900">{{ org.yearsInBusiness }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-gray-600">Key Clients</span>
              </div>
              <div class="text-sm text-gray-500">
                {{ org.keyClients || 'None listed' }}
              </div>
            </div>
          </div>

          <!-- Contact Person Card -->
          <div
            class="bg-indigo-50 p-6 rounded-xl border border-indigo-100"
            *ngIf="org.contactPersonName"
          >
            <h4 class="text-indigo-900 font-bold mb-3 flex items-center">
              <i class="bi bi-person-badge mr-2"></i> Point of Contact
            </h4>
            <div class="space-y-2">
              <p class="font-bold text-gray-900 text-lg">{{ org.contactPersonName }}</p>
              <p class="text-indigo-600 text-sm font-medium">{{ org.contactPersonDesignation }}</p>
              <hr class="border-indigo-200 my-2" />
              <p *ngIf="org.contactPersonEmail" class="text-sm text-gray-700 flex items-center">
                <i class="bi bi-envelope mr-2"></i> {{ org.contactPersonEmail }}
              </p>
              <p *ngIf="org.contactPersonPhone" class="text-sm text-gray-700 flex items-center">
                <i class="bi bi-telephone mr-2"></i> {{ org.contactPersonPhone }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ng-template>

    <!-- Allocate Resource Modal -->
    <app-allocate-resource-modal
      [isOpen]="showAllocateModal"
      [projectId]="project()?.id || null"
      [users]="users()"
      (close)="showAllocateModal = false"
      (saved)="loadAllocations(project()!.id)"
    ></app-allocate-resource-modal>
  `,
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  projectService = inject(ProjectService);
  userService = inject(UserService);
  headerService = inject(HeaderService);

  project = signal<Project | null>(null);
  allocations = signal<ProjectAllocation[]>([]);
  users = signal<User[]>([]);
  showAllocateModal = false;

  // New Property for Tabs
  activeTab = signal<string>('overview');
  tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'client', label: 'Client Details' },
    { id: 'internal', label: 'Internal Organization' },
    { id: 'allocations', label: 'Allocations' },
  ];

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
  }

  loadProject(id: string) {
    this.projectService.getProjects().subscribe((projects) => {
      const p = projects.find((p) => p.id === id);
      if (p) this.project.set(p);
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
}
