import { Component, inject, Output, EventEmitter, Input, computed } from '@angular/core';
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
    <header class="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 gap-4">
      <!-- Left: Menu Toggle + Title -->
      <div class="flex items-center gap-3 md:gap-4 shrink-0">
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

      <!-- Center: Role Toggle (Visible only for privileged users) -->
      <div class="hidden lg:flex flex-1 justify-center" *ngIf="shouldShowRoleToggle()">
        <div
          class="bg-gray-100/80 backdrop-blur-sm p-1 rounded-xl flex items-center gap-1 border border-gray-200/50 shadow-inner"
        >
          <!-- Administration Option -->
          <button
            *ngIf="canShowAdminOption()"
            (click)="setStartView('ADMIN')"
            class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2"
            [class.bg-white]="isCurrentView('ADMIN')"
            [class.text-indigo-600]="isCurrentView('ADMIN')"
            [class.shadow-sm]="isCurrentView('ADMIN')"
            [class.ring-1]="isCurrentView('ADMIN')"
            [class.ring-black/5]="isCurrentView('ADMIN')"
            [class.text-gray-500]="!isCurrentView('ADMIN')"
            [class.hover:text-gray-700]="!isCurrentView('ADMIN')"
            [class.hover:bg-gray-200/50]="!isCurrentView('ADMIN')"
          >
            <i class="bi bi-shield-lock"></i>
            <span>Administration</span>
          </button>

          <!-- Recruitment Option -->
          <button
            *ngIf="canShowRecruitmentOption()"
            (click)="setStartView('TA')"
            class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2"
            [class.bg-white]="isCurrentView('TA')"
            [class.text-indigo-600]="isCurrentView('TA')"
            [class.shadow-sm]="isCurrentView('TA')"
            [class.ring-1]="isCurrentView('TA')"
            [class.ring-black/5]="isCurrentView('TA')"
            [class.text-gray-500]="!isCurrentView('TA')"
            [class.hover:text-gray-700]="!isCurrentView('TA')"
            [class.hover:bg-gray-200/50]="!isCurrentView('TA')"
          >
            <i class="bi bi-briefcase"></i>
            <span>Recruitment</span>
          </button>

          <!-- Employee Option -->
          <button
            (click)="setStartView('EMPLOYEE')"
            class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2"
            [class.bg-white]="isCurrentView('EMPLOYEE')"
            [class.text-indigo-600]="isCurrentView('EMPLOYEE')"
            [class.shadow-sm]="isCurrentView('EMPLOYEE')"
            [class.ring-1]="isCurrentView('EMPLOYEE')"
            [class.ring-black/5]="isCurrentView('EMPLOYEE')"
            [class.text-gray-500]="!isCurrentView('EMPLOYEE')"
            [class.hover:text-gray-700]="!isCurrentView('EMPLOYEE')"
            [class.hover:bg-gray-200/50]="!isCurrentView('EMPLOYEE')"
          >
            <i class="bi bi-person"></i>
            <span>Employee</span>
          </button>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-2 md:gap-4 shrink-0">
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

  // Computed state for the toggle
  shouldShowRoleToggle = computed(() => {
    const role = this.authStore.actualRole();
    return ['SUPER_ADMIN', 'HR_ADMIN', 'TA'].includes(role || '');
  });

  canShowAdminOption = computed(() => {
    const role = this.authStore.actualRole();
    return ['SUPER_ADMIN', 'HR_ADMIN'].includes(role || '');
  });

  canShowRecruitmentOption = computed(() => {
    // Admin can see it, TA can see it.
    const role = this.authStore.actualRole();
    return ['SUPER_ADMIN', 'HR_ADMIN', 'TA'].includes(role || '');
  });

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  formatRole(role: any): string {
    if (!role) return '';
    const roleName = typeof role === 'string' ? role : role.name;
    return roleName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }

  setStartView(view: 'ADMIN' | 'TA' | 'EMPLOYEE') {
    if (view === 'ADMIN') {
      // Revert to actual role (null effectively resets to actual in store logic if implemented as such,
      // but store logic says: if role === actualRole, set null.
      // So if I am SUPER_ADMIN, passing SUPER_ADMIN cleans it.
      // But here I'll just pass null to be safe?
      // The store implementation: `setViewRole(role: string | null)`
      // If I pass 'SUPER_ADMIN' and actual is 'SUPER_ADMIN', it sets null.
      // Check authStore logic:
      /*
        if (role === this.actualRole()) {
          this._viewRole.set(null);
        } else {
          this._viewRole.set(role);
        }
      */
      // So passing the actual role is fine.
      // However, 'ADMIN' is not a role name. I should pass the actual role name.
      this.authStore.setViewRole(this.authStore.actualRole());
    } else if (view === 'TA') {
      this.authStore.setViewRole('TA');
    } else if (view === 'EMPLOYEE') {
      this.authStore.setViewRole('EMPLOYEE');
    }
  }

  isCurrentView(view: 'ADMIN' | 'TA' | 'EMPLOYEE'): boolean {
    const current = this.authStore.userRole(); // The effective role
    const actual = this.authStore.actualRole();

    if (view === 'ADMIN') {
      // It is admin view if the effective role is SUPER_ADMIN or HR_ADMIN
      return ['SUPER_ADMIN', 'HR_ADMIN'].includes(current || '');
    }

    if (view === 'TA') {
      return current === 'TA';
    }

    if (view === 'EMPLOYEE') {
      return current === 'EMPLOYEE';
    }

    return false;
  }
}
