import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { OrganizationLogoComponent } from '../../../shared/components/organization-logo/organization-logo.component';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, OrganizationLogoComponent],
  template: `
    <div class="space-y-6 animate-fade-in" *ngIf="client() as c">
      <!-- Breadcrumb & Back -->
      <div>
        <a
          routerLink="/clients"
          class="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center mb-4 transition-colors"
        >
          <i class="bi bi-arrow-left mr-1"></i> Back to Clients
        </a>
      </div>

      <!-- Header Banner -->
      <div class="card-modern p-6 md:p-8 relative overflow-hidden">
        <div
          class="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-indigo-50 to-blue-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16"
        ></div>

        <div class="relative flex flex-col md:flex-row gap-6 md:items-start z-10">
          <div class="shrink-0">
            <app-organization-logo
              [org]="c"
              [orgId]="c.id"
              size="xl"
              [rounded]="true"
            ></app-organization-logo>
          </div>

          <div class="flex-1 space-y-4">
            <div>
              <div class="flex flex-wrap items-center gap-3 mb-2">
                <h1 class="text-3xl md:text-4xl font-bold text-gray-900">{{ c.name }}</h1>
                <span
                  class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium border border-green-200"
                >
                  Active Client
                </span>
              </div>
              <p class="text-lg text-gray-500 max-w-2xl">
                {{ c.description || 'No description provided.' }}
              </p>
            </div>

            <div class="flex flex-wrap gap-4 md:gap-8 pt-2">
              <div class="flex items-center gap-2 text-gray-600">
                <div
                  class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"
                >
                  <i class="bi bi-briefcase"></i>
                </div>
                <div>
                  <p class="text-xs text-gray-400 font-medium">Industry</p>
                  <p class="font-medium">{{ c.industry || 'N/A' }}</p>
                </div>
              </div>

              <div class="flex items-center gap-2 text-gray-600">
                <div
                  class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"
                >
                  <i class="bi bi-geo-alt"></i>
                </div>
                <div>
                  <p class="text-xs text-gray-400 font-medium">Location</p>
                  <p class="font-medium">{{ c.city }}{{ c.country ? ', ' + c.country : '' }}</p>
                </div>
              </div>

              <div class="flex items-center gap-2 text-gray-600">
                <div
                  class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"
                >
                  <i class="bi bi-link-45deg"></i>
                </div>
                <div>
                  <p class="text-xs text-gray-400 font-medium">Website</p>
                  <a
                    *ngIf="c.website"
                    [href]="c.website"
                    target="_blank"
                    class="font-medium text-indigo-600 hover:underline"
                    >Visit Website</a
                  >
                  <span *ngIf="!c.website" class="font-medium">N/A</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <button
              class="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors px-4 py-2 rounded-lg flex items-center justify-center"
            >
              <i class="bi bi-pencil mr-2"></i> Edit Details
            </button>
          </div>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Stats & Contact -->
        <div class="space-y-6">
          <!-- Quick Stats -->
          <div class="card-modern p-5">
            <h3 class="font-bold text-gray-900 mb-4 flex items-center">
              <i class="bi bi-bar-chart-fill mr-2 text-indigo-500"></i> Performance
            </h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span class="text-gray-600">Active Projects</span>
                <span class="text-xl font-bold text-gray-900">{{ activeProjectsCount() }}</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span class="text-gray-600">Total Projects</span>
                <span class="text-xl font-bold text-gray-900">{{ clientProjects().length }}</span>
              </div>
            </div>
          </div>

          <!-- Contact Info -->
          <div class="card-modern p-5">
            <h3 class="font-bold text-gray-900 mb-4 flex items-center">
              <i class="bi bi-person-lines-fill mr-2 text-indigo-500"></i> Contact Details
            </h3>
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <i class="bi bi-envelope mt-1 text-gray-400"></i>
                <div>
                  <p class="text-xs text-gray-400">Email</p>
                  <a
                    [href]="'mailto:' + c.email"
                    class="text-indigo-600 hover:underline break-all"
                    >{{ c.email || 'N/A' }}</a
                  >
                </div>
              </div>
              <div class="flex items-start gap-3">
                <i class="bi bi-telephone mt-1 text-gray-400"></i>
                <div>
                  <p class="text-xs text-gray-400">Phone</p>
                  <p class="text-gray-700">{{ c.phone || 'N/A' }}</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <i class="bi bi-building mt-1 text-gray-400"></i>
                <div>
                  <p class="text-xs text-gray-400">Address</p>
                  <p class="text-gray-700 whitespace-pre-line">{{ c.address || 'N/A' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Projects List -->
        <div class="lg:col-span-2 space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900">Projects</h2>
            <button class="text-sm font-medium text-indigo-600 hover:text-indigo-800">
              View All
            </button>
          </div>

          <div class="grid grid-cols-1 gap-4">
            <div
              *ngFor="let project of clientProjects()"
              class="card-modern p-5 group hover:border-indigo-200 transition-all"
            >
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <h3
                      class="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors"
                    >
                      <a [routerLink]="['/projects', project.id]">{{ project.name }}</a>
                    </h3>
                    <span
                      class="px-2 py-0.5 rounded text-xs font-medium"
                      [ngClass]="{
                        'bg-green-100 text-green-700': project.status === 'ACTIVE',
                        'bg-blue-100 text-blue-700': project.status === 'PLANNED',
                        'bg-yellow-100 text-yellow-700': project.status === 'ON_HOLD',
                        'bg-gray-100 text-gray-700': project.status === 'COMPLETED',
                      }"
                    >
                      {{ project.status }}
                    </span>
                  </div>
                  <p class="text-gray-500 text-sm line-clamp-2 mb-3">{{ project.description }}</p>

                  <div class="flex items-center gap-4 text-xs text-gray-500 font-medium">
                    <span class="flex items-center gap-1">
                      <i class="bi bi-calendar"></i>
                      {{ project.startDate | date }} -
                      {{ project.endDate ? (project.endDate | date) : 'Ongoing' }}
                    </span>
                    <!-- Add more meta info if available -->
                  </div>
                </div>

                <a
                  [routerLink]="['/projects', project.id]"
                  class="btn-icon rounded-full w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <i class="bi bi-chevron-right"></i>
                </a>
              </div>
            </div>

            <div
              *ngIf="clientProjects().length === 0"
              class="text-center py-12 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200"
            >
              <i class="bi bi-folder text-4xl text-gray-300 mb-3 block"></i>
              <p class="text-gray-500">No projects started with this client yet.</p>
              <button class="mt-4 text-indigo-600 font-medium hover:underline">
                Create Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ClientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private clientService = inject(ClientService);
  private projectService = inject(ProjectService);

  client = signal<Client | undefined>(undefined);
  clientProjects = signal<Project[]>([]);

  activeProjectsCount = computed(() => {
    return this.clientProjects().filter((p) => p.status === 'ACTIVE').length;
  });

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadClient(id);
        this.loadProjects(id);
      }
    });
  }

  loadClient(id: string) {
    this.clientService.getClientById(id).subscribe((client) => {
      this.client.set(client);
    });
  }

  loadProjects(clientId: string) {
    this.projectService.getProjects().subscribe((projects) => {
      const filtered = projects.filter((p) => p.client?.id === clientId);
      this.clientProjects.set(filtered);
    });
  }
}
