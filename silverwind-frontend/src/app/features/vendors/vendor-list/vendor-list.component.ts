import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendorService } from '../../../core/services/vendor.service';
import { Organization } from '../../../core/models/auth.model';
import { HeaderService } from '../../../core/services/header.service';
import { OrganizationLogoComponent } from '../../../shared/components/organization-logo/organization-logo.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-vendor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, OrganizationLogoComponent],
  template: `
    <div class="space-y-6 md:space-y-8">
      <!-- Header with Stats -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div></div>
        <div class="flex gap-3">
          <span class="badge badge-warning">{{ pendingCount() }} Pending</span>
          <span class="badge badge-success">{{ approvedCount() }} Approved</span>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="card-modern p-4 flex flex-col md:flex-row gap-4">
        <div class="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <button
            *ngFor="let tab of tabs"
            (click)="activeTab = tab.value"
            class="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors"
            [class.bg-indigo-100]="activeTab === tab.value"
            [class.text-indigo-700]="activeTab === tab.value"
            [class.bg-gray-100]="activeTab !== tab.value"
            [class.text-gray-600]="activeTab !== tab.value"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="relative flex-1">
          <i class="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search vendors..."
            class="input-modern pl-11"
          />
        </div>
      </div>

      <!-- Vendor Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          *ngFor="let vendor of filteredVendors(); let i = index"
          class="card-modern relative p-6 animate-fade-in-up cursor-pointer transition-all group"
          [style.animation-delay.ms]="i * 50"
          [routerLink]="['/vendors', vendor.id]"
          [ngClass]="
            hasNotification(vendor.id)
              ? 'border-red-300 ring-2 ring-red-100 hover:shadow-red-100 hover:border-red-300'
              : 'hover:border-indigo-100 hover:shadow-lg'
          "
        >
          <!-- Notification Indicator -->
          <div *ngIf="hasNotification(vendor.id)" class="absolute top-3 right-3 z-10">
            <span class="flex h-3 w-3">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
              ></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
          <!-- Card Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-4">
              <app-organization-logo
                [org]="vendor"
                [orgId]="vendor.id"
                size="xl"
                [rounded]="true"
              ></app-organization-logo>
              <div>
                <h3 class="font-bold text-gray-900">{{ vendor.name }}</h3>
                <span class="badge text-xs" [ngClass]="getStatusBadgeClass(vendor.status)">
                  {{ vendor.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Vendor Info -->
          <div class="space-y-3 mb-5">
            <div class="flex items-center gap-3 text-sm">
              <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <i class="bi bi-building text-gray-500"></i>
              </div>
              <span class="text-gray-600">{{ vendor.type }}</span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <i class="bi bi-calendar text-gray-500"></i>
              </div>
              <span class="text-gray-600"
                >Registered {{ vendor.createdAt | date: 'mediumDate' }}</span
              >
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-4 border-t border-gray-100 flex gap-2">
            <button
              *ngIf="vendor.status === 'PENDING_VERIFICATION'"
              (click)="approve(vendor.id)"
              class="flex-1 py-2.5 px-4 bg-emerald-50 text-emerald-600 font-medium rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <i class="bi bi-check-lg mr-1"></i> Approve
            </button>
            <button
              *ngIf="vendor.status === 'PENDING_VERIFICATION'"
              (click)="reject(vendor.id)"
              class="flex-1 py-2.5 px-4 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors"
            >
              <i class="bi bi-x-lg mr-1"></i> Reject
            </button>
            <button
              *ngIf="vendor.status !== 'PENDING_VERIFICATION'"
              [routerLink]="['/vendors', vendor.id]"
              class="flex-1 py-2.5 px-4 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <i class="bi bi-eye mr-1"></i> View Details
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredVendors().length === 0" class="card-modern p-12 text-center">
        <div
          class="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <i class="bi bi-shop text-3xl text-gray-400"></i>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">No vendors found</h3>
        <p class="text-gray-500">
          {{ searchQuery ? 'Try a different search term' : 'No vendors in this category' }}
        </p>
      </div>
    </div>
  `,
})
export class VendorListComponent implements OnInit {
  vendorService = inject(VendorService);
  headerService = inject(HeaderService);
  notificationService = inject(NotificationService);

  vendors = signal<Organization[]>([]);
  unreadVendorIds = new Set<string>();
  pendingCount = signal(0);
  approvedCount = signal(0);
  searchQuery = '';
  activeTab = 'all';

  tabs = [
    { label: 'All Vendors', value: 'all' },
    { label: 'Pending', value: 'PENDING_VERIFICATION' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  ngOnInit() {
    this.headerService.setTitle('Vendor Management', 'Manage vendor organizations', 'bi bi-shop');
    this.loadUnreadVendorIds();
    this.loadVendors();
  }

  loadUnreadVendorIds() {
    this.notificationService.getUnreadEntityIds('ORGANIZATION').subscribe({
      next: (ids) => (this.unreadVendorIds = new Set(ids)),
      error: () => (this.unreadVendorIds = new Set()),
    });
  }

  hasNotification(vendorId: string): boolean {
    return this.unreadVendorIds.has(vendorId);
  }

  loadVendors() {
    this.vendorService.getVendors().subscribe((data) => {
      // Sort: notified first
      const sorted = [...data].sort((a, b) => {
        const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
        const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
        return bHasNotif - aHasNotif;
      });
      this.vendors.set(sorted);
      this.pendingCount.set(data.filter((v) => v.status === 'PENDING_VERIFICATION').length);
      this.approvedCount.set(
        data.filter((v) => v.status === 'APPROVED' || v.status === 'ACTIVE').length,
      );
    });
  }

  filteredVendors() {
    let result = this.vendors();

    // Filter by tab
    if (this.activeTab !== 'all') {
      result = result.filter((v) => v.status === this.activeTab);
    }

    // Filter by search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter((v) => v.name.toLowerCase().includes(query));
    }

    return result;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return 'badge-warning';
      case 'APPROVED':
      case 'ACTIVE':
        return 'badge-success';
      case 'REJECTED':
        return 'badge-danger';
      default:
        return 'badge-primary';
    }
  }

  approve(id: string) {
    if (confirm('Approve this vendor?')) {
      this.vendorService.approveVendor(id).subscribe(() => this.loadVendors());
    }
  }

  reject(id: string) {
    if (confirm('Reject this vendor?')) {
      this.vendorService.rejectVendor(id).subscribe(() => this.loadVendors());
    }
  }

  gradients = [
    'from-emerald-400 to-teal-500',
    'from-indigo-400 to-purple-500',
    'from-pink-400 to-rose-500',
    'from-amber-400 to-orange-500',
    'from-cyan-400 to-blue-500',
    'from-lime-400 to-green-500',
    'from-fuchsia-400 to-violet-500',
  ];

  getRandomGradient(): string {
    return this.gradients[Math.floor(Math.random() * this.gradients.length)];
  }
}
