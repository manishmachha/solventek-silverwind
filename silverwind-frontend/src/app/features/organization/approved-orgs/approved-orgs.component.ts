import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrganizationService } from '../../../core/services/organization.service';
import { Organization } from '../../../core/models/auth.model';
import { HeaderService } from '../../../core/services/header.service';
import { OrganizationLogoComponent } from '../../../shared/components/organization-logo/organization-logo.component';

@Component({
  selector: 'app-approved-orgs',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, OrganizationLogoComponent],
  template: `
    <div class="space-y-6 md:space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900">Explore Organizations</h2>
          <p class="mt-1 text-sm text-gray-500">Discover approved organizations and vendors</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="card-modern p-4 flex flex-col md:flex-row gap-4">
        <div class="relative flex-1">
          <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search organizations by name or industry..."
            class="input-modern pl-11"
          />
        </div>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          *ngFor="let org of filteredOrgs(); let i = index"
          class="card-modern p-6 animate-fade-in-up cursor-pointer hover:shadow-lg transition-all group"
          [style.animation-delay.ms]="i * 50"
          [routerLink]="['/organization', org.id]"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-4">
              <app-organization-logo
                [org]="org"
                [orgId]="org.id"
                size="md"
                [rounded]="true"
                class="shrink-0"
              ></app-organization-logo>
              <div>
                <h3 class="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {{ org.name }}
                </h3>
                <span class="text-xs text-gray-500">{{ org.industry || 'Unknown Industry' }}</span>
              </div>
            </div>
            <span class="badge badge-primary">{{ org.type }}</span>
          </div>

          <p class="text-sm text-gray-600 mb-4 line-clamp-3">
            {{ org.description || 'No description provided.' }}
          </p>

          <div class="flex flex-wrap gap-2 mb-4">
            <span *ngIf="org.city" class="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
              <i class="bi bi-geo-alt"></i> {{ org.city }}
            </span>
            <span
              *ngIf="org.employeeCount"
              class="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
            >
              <i class="bi bi-people"></i> {{ org.employeeCount }}+
            </span>
          </div>

          <div class="pt-4 border-t border-gray-100 flex justify-end">
            <span
              class="text-indigo-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center"
            >
              View Details <i class="bi bi-arrow-right ml-1"></i>
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredOrgs().length === 0" class="card-modern p-12 text-center">
        <div
          class="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <i class="bi bi-building text-3xl text-gray-400"></i>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">No organizations found</h3>
        <p class="text-gray-500">Try adjusting your search criteria</p>
      </div>
    </div>
  `,
})
export class ApprovedOrgsComponent implements OnInit {
  orgService = inject(OrganizationService);
  headerService = inject(HeaderService);

  orgs = signal<Organization[]>([]);
  searchQuery = '';

  ngOnInit() {
    this.headerService.setTitle('Explore Organizations', 'Find organizations', 'bi bi-globe');
    this.loadOrgs();
  }

  loadOrgs() {
    this.orgService.getApprovedOrganizations().subscribe((data) => {
      this.orgs.set(data);
    });
  }

  filteredOrgs() {
    let result = this.orgs();
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) || (o.industry && o.industry.toLowerCase().includes(q)),
      );
    }
    return result;
  }
}
