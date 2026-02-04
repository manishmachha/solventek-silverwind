import { Component, inject, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderService } from '../../../core/services/header.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { NotificationDropdownComponent } from '../../../shared/components/notification-dropdown/notification-dropdown.component';
import { OrganizationLogoComponent } from '../../../shared/components/organization-logo/organization-logo.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NotificationDropdownComponent, OrganizationLogoComponent],
  template: `
    <header class="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
      <!-- Left: Menu Toggle + Title -->
      <div class="flex items-center gap-3 md:gap-4">
        <!-- Mobile Menu Toggle -->
        <button
          (click)="toggleSidebar.emit()"
          class="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <i
            class="bi"
            [class.bi-list]="!sidebarOpen"
            [class.bi-x-lg]="sidebarOpen"
            class="text-xl"
          ></i>
        </button>

        <!-- Dynamic Title with Icon -->
        <div class="flex items-center gap-3">
          <div
            class="hidden sm:flex p-2.5 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
          >
            <i [class]="headerService.icon() + ' text-lg'"></i>
          </div>
          <div>
            <h1 class="text-lg md:text-xl font-bold text-gray-900 leading-tight">
              {{ headerService.title() }}
            </h1>
            <p
              class="text-xs md:text-sm text-gray-500 font-medium hidden sm:block"
              *ngIf="headerService.subtitle()"
            >
              {{ headerService.subtitle() }}
            </p>
          </div>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-2 md:gap-4">
        <!-- Notification Dropdown -->
        <app-notification-dropdown></app-notification-dropdown>

        <app-organization-logo
          [org]="authStore.user()?.organization"
          [orgId]="authStore.user()?.orgId"
          size="md"
          [rounded]="true"
          class="hidden sm:block shadow-sm"
        ></app-organization-logo>

        <!-- User Profile -->
        <div class="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-200">
          <!-- User Avatar -->
          <div class="avatar avatar-md text-sm">
            {{ user()?.firstName?.charAt(0) || 'U' }}{{ user()?.lastName?.charAt(0) || '' }}
          </div>

          <!-- User Info (Hidden on mobile) -->
          <div class="hidden md:block text-right">
            <p class="text-sm font-semibold text-gray-900">
              {{ user()?.firstName }} {{ user()?.lastName }}
            </p>
            <p class="text-xs text-gray-500">{{ formatRole(user()?.role) }}</p>
          </div>

          <!-- Logout Button -->
          <button
            (click)="logout()"
            class="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
            title="Logout"
          >
            <i class="bi bi-box-arrow-right text-lg"></i>
          </button>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  @Input() sidebarOpen = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  headerService = inject(HeaderService);
  authStore = inject(AuthStore);
  authService = inject(AuthService);
  router = inject(Router);

  user = this.authStore.user;

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  formatRole(role: any): string {
    if (!role) return '';
    const roleName = typeof role === 'string' ? role : role.name;
    return roleName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }
}
