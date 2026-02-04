import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthStore } from '../../../core/stores/auth.store';
import { OrganizationService } from '../../../core/services/organization.service';
import { HeaderService } from '../../../core/services/header.service';
import { Organization } from '../../../core/models/auth.model';
import { OrganizationLogoComponent } from '../../../shared/components/organization-logo/organization-logo.component';
import { EditOrganizationDialogComponent } from '../components/edit-organization-dialog/edit-organization-dialog.component';

@Component({
  selector: 'app-my-organization',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTabsModule,
    OrganizationLogoComponent,
  ],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6">
      <!-- Loading State -->
      <div *ngIf="loading()" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <ng-container *ngIf="org() as organization">
        <!-- Header Card -->
        <div
          class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6"
        >
          <!-- Logo -->
          <div class="relative shrink-0">
            <app-organization-logo
              [org]="organization"
              size="2xl"
              [rounded]="true"
            ></app-organization-logo>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-3xl font-bold text-gray-900 truncate">{{ organization.name }}</h1>
              <span
                class="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full border border-blue-200"
              >
                {{ organization.type }}
              </span>
              <span
                *ngIf="organization.status === 'APPROVED'"
                class="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full border border-green-200"
              >
                Verified
              </span>
            </div>

            <div class="flex flex-wrap gap-4 text-gray-600 mb-4">
              <div *ngIf="organization.website" class="flex items-center gap-1">
                <mat-icon class="text-sm h-4 w-4">language</mat-icon>
                <a
                  [href]="organization.website"
                  target="_blank"
                  class="hover:text-indigo-600 transition-colors"
                  >{{ organization.website }}</a
                >
              </div>
              <div
                *ngIf="organization.city || organization.country"
                class="flex items-center gap-1"
              >
                <mat-icon class="text-sm h-4 w-4">location_on</mat-icon>
                <span>{{ organization.city }}, {{ organization.country }}</span>
              </div>
              <div *ngIf="organization.industry" class="flex items-center gap-1">
                <mat-icon class="text-sm h-4 w-4">business</mat-icon>
                <span>{{ organization.industry }}</span>
              </div>
            </div>

            <p class="text-gray-600 max-w-3xl line-clamp-2 md:line-clamp-none">
              {{ organization.description || 'No description provided.' }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 mt-4 md:mt-0 ml-auto">
            <button
              class="flex items-center gap-2 bg-linear-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-md cursor-pointer"
              (click)="openEditDialog()"
            >
              <mat-icon>edit</mat-icon>
              Edit Profile
            </button>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Main Content -->
          <div class="md:col-span-2 space-y-6">
            <!-- About -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 class="text-lg font-bold text-gray-900 mb-4">About Organization</h2>
              <div class="prose max-w-none text-gray-600">
                <p>{{ organization.description || 'No detailed description available.' }}</p>
              </div>

              <div class="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span class="block text-xs font-semibold text-gray-500 uppercase"
                    >Service Offerings</span
                  >
                  <p class="text-gray-900 mt-1">{{ organization.serviceOfferings || 'N/A' }}</p>
                </div>
                <div>
                  <span class="block text-xs font-semibold text-gray-500 uppercase"
                    >Employee Count</span
                  >
                  <p class="text-gray-900 mt-1">{{ organization.employeeCount || 'N/A' }}</p>
                </div>
                <div>
                  <span class="block text-xs font-semibold text-gray-500 uppercase"
                    >Years in Business</span
                  >
                  <p class="text-gray-900 mt-1">{{ organization.yearsInBusiness || 'N/A' }}</p>
                </div>
              </div>
            </div>

            <!-- Contact -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 class="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                <div class="flex items-start gap-3">
                  <div class="bg-indigo-50 p-2 rounded-lg text-indigo-600 shrink-0">
                    <mat-icon>phone</mat-icon>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">Phone</p>
                    <p class="text-gray-600">{{ organization.phone || 'N/A' }}</p>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <div class="bg-indigo-50 p-2 rounded-lg text-indigo-600 shrink-0">
                    <mat-icon>email</mat-icon>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">Email</p>
                    <p class="text-gray-600">{{ organization.email || 'N/A' }}</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 col-span-1 sm:col-span-2">
                  <div class="bg-indigo-50 p-2 rounded-lg text-indigo-600 shrink-0">
                    <mat-icon>location_on</mat-icon>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">Address</p>
                    <p class="text-gray-600">
                      {{ organization.addressLine1 }}<br *ngIf="organization.addressLine1" />
                      {{ organization.addressLine2 }}<br *ngIf="organization.addressLine2" />
                      {{ organization.city
                      }}<span *ngIf="organization.city && organization.state">, </span
                      >{{ organization.state }} {{ organization.postalCode }}<br />
                      {{ organization.country }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar Info (Legal, Admin only) -->
          <div class="space-y-6">
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <mat-icon class="text-gray-400">gavel</mat-icon> Legal Information
              </h2>
              <div class="space-y-3">
                <div>
                  <span class="block text-xs text-gray-500">Legal Name</span>
                  <p class="font-medium text-gray-900">
                    {{ organization.legalName || organization.name }}
                  </p>
                </div>
                <div>
                  <span class="block text-xs text-gray-500">Registration Number</span>
                  <p class="font-medium text-gray-900">
                    {{ organization.registrationNumber || 'N/A' }}
                  </p>
                </div>
                <div>
                  <span class="block text-xs text-gray-500">Tax ID / PAN</span>
                  <p class="font-medium text-gray-900">{{ organization.taxId || 'N/A' }}</p>
                </div>
              </div>
            </div>

            <!-- Completion Status Widget? -->
            <div
              class="bg-linear-to-br from-indigo-600 to-purple-600 p-6 rounded-2xl text-white shadow-md"
            >
              <h3 class="font-bold mb-2">Complete your Profile</h3>
              <p class="text-indigo-100 text-sm mb-4">A complete profile increases trust.</p>
              <div class="w-full bg-white/20 rounded-full h-2 mb-2">
                <div class="bg-white h-2 rounded-full" style="width: 75%"></div>
              </div>
              <span class="text-xs font-medium text-indigo-100">75% Complete</span>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class MyOrganizationComponent implements OnInit {
  authStore = inject(AuthStore);
  orgService = inject(OrganizationService);
  dialog = inject(MatDialog);
  headerService = inject(HeaderService);

  org = signal<Organization | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.headerService.setTitle(
      'Organization Profile',
      'Manage your organization details',
      'bi bi-building',
    );
    this.loadOrg();
  }

  loadOrg() {
    // Get current user's org ID from store
    const user = this.authStore.user();
    if (user && user.orgId) {
      this.loading.set(true);
      this.orgService.getOrganizationById(user.orgId).subscribe({
        next: (o) => {
          this.org.set(o);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        },
      });
    } else {
      this.loading.set(false);
    }
  }

  openEditDialog() {
    const o = this.org();
    if (!o) return;

    const dialogRef = this.dialog.open(EditOrganizationDialogComponent, {
      width: '800px',
      data: { org: o },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadOrg(); // Reload updated data
      }
    });
  }
}
