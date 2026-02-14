import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/client.model';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { ClientFormComponent } from '../components/client-form/client-form.component';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatDialogModule],
  template: `
    <div class="space-y-6 md:space-y-8 animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Clients</h1>
          <p class="text-gray-500">Manage your client relationships and projects</p>
        </div>
        <button
          (click)="openClientDialog()"
          class="btn-primary inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <i class="bi bi-plus-lg mr-2"></i> Add Client
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          class="p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 bg-linear-to-br from-blue-500 to-blue-600"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm font-medium">Total Clients</p>
              <h3 class="text-3xl font-bold text-white mt-1">{{ clients().length }}</h3>
            </div>
            <div
              class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white text-xl"
            >
              <i class="bi bi-buildings"></i>
            </div>
          </div>
        </div>
        <div
          class="p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 bg-linear-to-br from-indigo-500 to-indigo-600"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-indigo-100 text-sm font-medium">Active Projects</p>
              <h3 class="text-3xl font-bold text-white mt-1">{{ activeProjectsCount() }}</h3>
            </div>
            <div
              class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white text-xl"
            >
              <i class="bi bi-kanban"></i>
            </div>
          </div>
        </div>
        <div
          class="p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 bg-linear-to-br from-purple-500 to-purple-600"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm font-medium">Industries</p>
              <h3 class="text-3xl font-bold text-white mt-1">{{ uniqueIndustriesCount() }}</h3>
            </div>
            <div
              class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white text-xl"
            >
              <i class="bi bi-briefcase"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Search & Controls -->
      <div class="card-modern p-4 flex flex-col md:flex-row gap-4 items-center">
        <div class="relative flex-1 w-full">
          <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search clients by name, city, or industry..."
            class="input-modern pl-11 w-full"
          />
        </div>
        <select
          [(ngModel)]="industryFilter"
          class="w-full md:w-auto px-4 py-2.5 rounded-xl border-gray-200 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Industries</option>
          <option *ngFor="let ind of uniqueIndustries()" [value]="ind">{{ ind }}</option>
        </select>
      </div>

      <!-- Clients Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          *ngFor="let client of filteredClients()"
          class="card-modern group hover:border-indigo-200 transition-all duration-300"
        >
          <!-- Card Content -->
          <div class="p-6">
            <div class="flex items-start justify-between mb-6">
              <div class="flex items-center gap-4">
                <div
                  class="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100"
                >
                  <img
                    *ngIf="client.logoUrl"
                    [src]="client.logoUrl"
                    alt="{{ client.name }} logo"
                    class="w-full h-full object-cover"
                  />
                  <span *ngIf="!client.logoUrl" class="text-2xl font-bold text-gray-400">
                    {{ client.name.charAt(0) }}
                  </span>
                </div>
                <div>
                  <h3
                    class="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors"
                  >
                    {{ client.name }}
                  </h3>
                  <p class="text-sm text-gray-500">{{ client.industry || 'Unknown Industry' }}</p>
                </div>
              </div>
              <div class="relative">
                <button
                  (click)="toggleMenu(client.id); $event.stopPropagation()"
                  class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <!-- Dropdown Menu -->
                <div
                  *ngIf="activeMenuId === client.id"
                  class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-fade-in-up"
                >
                  <button
                    (click)="openClientDialog(client)"
                    class="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <i class="bi bi-pencil mr-3 text-gray-400"></i> Edit Client
                  </button>
                  <button
                    (click)="deleteClient(client)"
                    class="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <i class="bi bi-trash3 mr-3"></i> Delete
                  </button>
                </div>
              </div>
            </div>

            <div class="space-y-3 mb-6">
              <div class="flex items-center gap-3 text-sm text-gray-600">
                <div
                  class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"
                >
                  <i class="bi bi-geo-alt"></i>
                </div>
                <span>{{ client.city }}, {{ client.country }}</span>
              </div>
              <div class="flex items-center gap-3 text-sm text-gray-600">
                <div
                  class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"
                >
                  <i class="bi bi-globe"></i>
                </div>
                <a
                  [href]="client.website"
                  target="_blank"
                  class="hover:text-indigo-600 hover:underline truncate"
                >
                  {{ client.website || 'No website' }}
                </a>
              </div>
              <div class="flex items-center gap-3 text-sm text-gray-600">
                <div
                  class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"
                >
                  <i class="bi bi-kanban"></i>
                </div>
                <span>{{ getClientProjectCount(client.id) }} Projects</span>
              </div>
            </div>

            <div class="pt-6 border-t border-gray-100">
              <a
                [routerLink]="['/clients', client.id]"
                class="flex items-center justify-center w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                View Details
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredClients().length === 0" class="card-modern p-12 text-center">
        <div
          class="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <i class="bi bi-buildings text-3xl text-gray-400"></i>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">No clients found</h3>
        <p class="text-gray-500 mb-6">
          {{
            searchQuery
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first client'
          }}
        </p>
        <button
          (click)="openClientDialog(); searchQuery = ''"
          class="btn-primary px-6 py-3 rounded-xl font-semibold"
        >
          <i class="bi bi-plus-lg mr-2"></i> Add Client
        </button>
      </div>

      <!-- Delete Confirmation Modal (Custom simple one or re-use existing patterns) -->
    </div>
  `,
})
export class ClientListComponent implements OnInit {
  private clientService = inject(ClientService);
  private projectService = inject(ProjectService);
  private dialog = inject(MatDialog);

  clients = signal<Client[]>([]);
  projects = signal<Project[]>([]);

  searchQuery = '';
  industryFilter = '';
  activeMenuId: string | null = null;

  ngOnInit() {
    this.loadData();
    document.addEventListener('click', () => (this.activeMenuId = null));
  }

  loadData() {
    this.clientService.getAllClients().subscribe((data) => this.clients.set(data));
    this.projectService.getProjects().subscribe((data) => this.projects.set(data));
  }

  filteredClients = computed(() => {
    let result = this.clients();
    const query = this.searchQuery.toLowerCase();

    if (this.industryFilter) {
      result = result.filter((c) => c.industry === this.industryFilter);
    }

    if (query) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.city?.toLowerCase().includes(query) ||
          c.industry?.toLowerCase().includes(query),
      );
    }

    return result;
  });

  // Stats computed values
  activeProjectsCount = computed(
    () => this.projects().filter((p) => p.status === 'ACTIVE' && p.client).length,
  );

  uniqueIndustries = computed(
    () =>
      [
        ...new Set(
          this.clients()
            .map((c) => c.industry)
            .filter(Boolean),
        ),
      ] as string[],
  );

  uniqueIndustriesCount = computed(() => this.uniqueIndustries().length);

  getClientProjectCount(clientId: string): number {
    return this.projects().filter((p) => p.client?.id === clientId).length;
  }

  openClientDialog(client?: Client) {
    this.activeMenuId = null;
    const dialogRef = this.dialog.open(ClientFormComponent, {
      width: '600px',
      data: client,
      panelClass: 'custom-dialog-container',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  toggleMenu(id: string) {
    this.activeMenuId = this.activeMenuId === id ? null : id;
  }

  deleteClient(client: Client) {
    this.activeMenuId = null;
    if (confirm(`Are you sure you want to delete ${client.name}?`)) {
      this.clientService.deleteClient(client.id).subscribe(() => this.loadData());
    }
  }
}
