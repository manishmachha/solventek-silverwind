import {
  Component,
  inject,
  Output,
  EventEmitter,
  OnInit,
  signal,
  effect,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';
import { UserRole, OrganizationType } from '../../../core/models/auth.model';
import {
  NotificationService,
  NotificationCounts,
} from '../../../core/services/notification.service';
import { OrganizationLogoComponent } from '../../../shared/components/organization-logo/organization-logo.component';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  roles: UserRole[];
  orgTypes: OrganizationType[];
  notificationCategory?: string;
}

interface MenuSection {
  title: string;
  icon?: string;
  items: MenuItem[];
  collapsed?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, OrganizationLogoComponent],
  template: `
    <!-- Logo -->
    <div class="h-16 flex items-center px-6 border-b border-gray-200/50">
      <div class="flex items-center gap-3">
        <app-organization-logo
          [org]="authStore.user()?.organization"
          [orgId]="authStore.user()?.orgId"
          [name]="getOrgName()"
          size="md"
          class="shadow-lg rounded-lg block"
        ></app-organization-logo>
        <div>
          <span
            class="text-xl font-bold bg-clip-text text-transparent"
            [ngClass]="getOrgTextGradient()"
          >
            {{ getOrgName() }}
          </span>
          <p class="text-[10px] text-gray-400 font-medium tracking-wider uppercase">
            {{ getPortalType() }}
          </p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-4 custom-scrollbar">
      <div class="space-y-4">
        <ng-container *ngFor="let section of visibleSections()">
          <div class="menu-section">
            <!-- Section Header (Collapsible) -->
            <button
              (click)="toggleSection(section)"
              class="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-indigo-600 transition-colors mb-1 group"
            >
              <div class="flex items-center gap-2">
                <i *ngIf="section.icon" [class]="section.icon + ' text-sm'"></i>
                <span>{{ section.title }}</span>
                <!-- Section Notification Badge -->
                <span
                  *ngIf="getSectionNotificationCount(section) > 0 && section.collapsed"
                  class="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-600 rounded-full"
                >
                  {{ getSectionNotificationCount(section) }}
                </span>
              </div>
              <i
                class="bi transition-transform duration-200"
                [class.bi-chevron-down]="!section.collapsed"
                [class.bi-chevron-right]="section.collapsed"
              ></i>
            </button>

            <!-- Section Items -->
            <div
              class="space-y-1 transition-all duration-300 overflow-hidden"
              [style.max-height]="section.collapsed ? '0px' : '1000px'"
              [style.opacity]="section.collapsed ? '0' : '1'"
            >
              <ng-container *ngFor="let item of section.items">
                <a
                  [routerLink]="item.route"
                  routerLinkActive="active-link"
                  [routerLinkActiveOptions]="{ exact: isExactRoute(item.route) }"
                  (click)="onMenuClick()"
                  class="nav-item group flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-linear-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-200 relative ml-1"
                >
                  <div
                    class="nav-icon w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-white group-hover:shadow-md flex items-center justify-center transition-all duration-200 relative"
                  >
                    <i
                      [class]="
                        item.icon +
                        ' text-base text-gray-500 group-hover:text-indigo-600 transition-colors'
                      "
                    ></i>
                    <!-- Notification Dot -->
                    <span
                      *ngIf="getNotificationCount(item) > 0"
                      class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse"
                    >
                      {{ getNotificationCount(item) > 9 ? '9+' : getNotificationCount(item) }}
                    </span>
                  </div>
                  <span class="font-medium text-sm flex-1 truncate">{{ item.label }}</span>
                  <!-- Notification Badge -->
                  <span
                    *ngIf="getNotificationCount(item) > 0"
                    class="px-1.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-600 rounded-full"
                  >
                    {{ getNotificationCount(item) }}
                  </span>
                  <div
                    *ngIf="!getNotificationCount(item)"
                    class="active-dot w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-0 transition-opacity"
                  ></div>
                </a>
              </ng-container>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- Divider -->
      <div class="my-6 border-t border-gray-200/50"></div>

      <!-- Profile Section -->
      <div class="space-y-1">
        <a
          routerLink="/profile"
          routerLinkActive="active-link"
          (click)="onMenuClick()"
          class="nav-item group flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-linear-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 transition-all duration-200"
        >
          <div
            class="nav-icon w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-white group-hover:shadow-md flex items-center justify-center transition-all duration-200"
          >
            <i
              class="bi bi-person-circle text-lg text-gray-500 group-hover:text-indigo-600 transition-colors"
            ></i>
          </div>
          <span class="font-medium text-sm">My Profile</span>
        </a>
      </div>
    </nav>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-200/50 bg-white">
      <div
        class="px-4 py-3 rounded-xl transition-all duration-300 hover:shadow-md cursor-default"
        [ngClass]="getOrgFooterBg()"
      >
        <div class="flex items-center gap-2">
          <span class="badge text-[10px]" [ngClass]="getRoleBadgeClass()">{{
            formatRole(authStore.userRole())
          }}</span>
        </div>
        <p class="text-[10px] text-gray-500 mt-1">&copy; 2026 Solventek Technologies</p>
      </div>
    </div>
  `,
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #e5e7eb;
        border-radius: 20px;
      }
      .nav-item.active-link {
        background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%);
        color: #4f46e5;
      }
      .nav-item.active-link .nav-icon {
        background: white;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
      }
      .nav-item.active-link .nav-icon i {
        color: #6366f1;
      }
      .nav-item.active-link .active-dot {
        opacity: 1;
      }
    `,
  ],
})
export class SidebarComponent implements OnInit {
  @Output() menuItemClick = new EventEmitter<void>();
  authStore = inject(AuthStore);
  private notificationService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  notificationCounts = signal<NotificationCounts | null>(null);

  // State for visible sections
  visibleSections = signal<MenuSection[]>([]);

  // Base config - Updated for Solventek + Vendor only
  private readonly menuSectionsConfig: MenuSection[] = [
    {
      title: 'Dashboard',
      icon: 'bi bi-grid',
      items: [
        {
          label: 'Overview',
          route: '/dashboard',
          icon: 'bi bi-speedometer2',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN', 'TA', 'EMPLOYEE', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
        {
          label: 'My Organization',
          route: '/organization/my-organization',
          icon: 'bi bi-building',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN', 'TA', 'EMPLOYEE', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
        {
          label: 'Explore',
          route: '/organization/discovery',
          icon: 'bi bi-globe',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN', 'TA'],
          orgTypes: ['SOLVENTEK'],
        },
      ],
    },
    {
      title: 'Administration',
      icon: 'bi bi-shield-lock',
      items: [
        {
          label: 'Vendors',
          route: '/vendors',
          icon: 'bi bi-shop',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'ORGANIZATION',
        },
        {
          label: 'Employees',
          route: '/admin/employees',
          icon: 'bi bi-people',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'USER',
        },
        {
          label: 'Audit Logs',
          route: '/admin/audit-logs',
          icon: 'bi bi-activity',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN'],
          orgTypes: ['SOLVENTEK'],
        },
      ],
    },
    {
      title: 'Recruitment',
      icon: 'bi bi-briefcase',
      items: [
        {
          label: 'Jobs',
          route: '/jobs',
          icon: 'bi bi-briefcase-fill',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN', 'TA', 'EMPLOYEE', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
          notificationCategory: 'JOB',
        },
        {
          label: 'Candidates',
          route: '/candidates',
          icon: 'bi bi-person-badge',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN', 'TA', 'VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
        },
        {
          label: 'Applications',
          route: '/applications',
          icon: 'bi bi-file-earmark-text',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN', 'TA'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'APPLICATION',
        },
        {
          label: 'Track Applications',
          route: '/track-applications',
          icon: 'bi bi-list-check',
          roles: ['VENDOR'],
          orgTypes: ['SOLVENTEK', 'VENDOR'],
          notificationCategory: 'TRACKING',
        },
      ],
    },
    {
      title: 'Workforce',
      icon: 'bi bi-people',
      items: [
        {
          label: 'Projects',
          route: '/projects',
          icon: 'bi bi-kanban',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN', 'TA'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'PROJECT',
        },
        {
          label: 'Holidays',
          route: '/holidays',
          icon: 'bi bi-calendar-event',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN', 'TA', 'EMPLOYEE'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'HOLIDAY',
        },
      ],
    },
    {
      title: 'Assets',
      icon: 'bi bi-laptop',
      items: [
        {
          label: 'Asset Management',
          route: '/admin/assets',
          icon: 'bi bi-laptop',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'ASSET',
        },
        {
          label: 'My Assets',
          route: '/my-assets',
          icon: 'bi bi-box-seam',
          roles: ['EMPLOYEE'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'ASSET',
        },
      ],
    },
    {
      title: 'Leaves & Pay',
      icon: 'bi bi-cash-stack',
      items: [
        {
          label: 'Attendance Management',
          route: '/admin/attendance',
          icon: 'bi bi-calendar-check',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'ATTENDANCE',
        },
        {
          label: 'Leave Requests',
          icon: 'bi bi-calendar2-week',
          route: '/admin/leave-management',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'LEAVE',
        },
        {
          label: 'Leave Configuration',
          icon: 'bi bi-gear',
          route: '/admin/leave-configuration',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN'],
          orgTypes: ['SOLVENTEK'],
        },
        {
          label: 'My Attendance',
          route: '/my-attendance',
          icon: 'bi bi-calendar3',
          roles: ['EMPLOYEE'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'ATTENDANCE',
        },
        {
          label: 'My Leaves',
          icon: 'bi bi-calendar-x',
          route: '/my-leaves',
          roles: ['EMPLOYEE'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'LEAVE',
        },
        {
          label: 'Payroll Mgmt',
          route: '/admin/payroll',
          icon: 'bi bi-currency-rupee',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN'],
          orgTypes: ['SOLVENTEK'],
        },
        {
          label: 'My Payslips',
          route: '/my-payslips',
          icon: 'bi bi-paypal',
          roles: ['EMPLOYEE'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'PAYROLL',
        },
      ],
    },
    {
      title: 'Support',
      icon: 'bi bi-headset',
      items: [
        {
          label: 'My Tickets',
          route: '/portal/tickets',
          icon: 'bi bi-ticket',
          roles: ['SUPER_ADMIN', 'HR_ADMIN', 'ADMIN', 'TA', 'EMPLOYEE'],
          orgTypes: ['SOLVENTEK'],
          notificationCategory: 'TICKET',
        },
      ],
    },
  ];

  constructor() {
    // Recompute visible sections whenever user/role changes
    effect(
      () => {
        const role = this.authStore.userRole();
        const user = this.authStore.user();
        if (role && user) {
          this.calculateVisibleSections(role as UserRole, user.orgType as OrganizationType);
        }
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit() {
    // Service handles centralized polling
  }

  getNotificationCount(item: MenuItem): number {
    const counts = this.notificationService.notificationCounts();
    if (!counts || !item.notificationCategory) return 0;
    return (counts as any)[item.notificationCategory] || 0;
  }

  getSectionNotificationCount(section: MenuSection): number {
    return section.items.reduce((total, item) => total + this.getNotificationCount(item), 0);
  }

  toggleSection(targetSection: MenuSection) {
    this.visibleSections.update((sections) => {
      return sections.map((s) => {
        if (s === targetSection) {
          return { ...s, collapsed: !s.collapsed };
        }
        return s;
      });
    });
  }

  calculateVisibleSections(userRole: UserRole, userOrgType: OrganizationType) {
    const filtered = this.menuSectionsConfig
      .map((section) => {
        // Filter items according to role/org
        const validItems = section.items.filter((item) => {
          const roleMatch = item.roles.includes(userRole);
          const orgMatch = item.orgTypes.includes(userOrgType);
          return roleMatch && orgMatch;
        });

        return {
          ...section,
          items: validItems,
          collapsed: false,
        };
      })
      .filter((section) => section.items.length > 0);

    this.visibleSections.set(filtered);
  }

  isExactRoute(route: string): boolean {
    return ['/dashboard', '/admin'].includes(route);
  }

  getOrgName(): string {
    const orgType = this.authStore.user()?.orgType;
    if (orgType === 'SOLVENTEK') return 'Silverwind';
    if (orgType === 'VENDOR') return 'Vendor Portal';
    return 'Silverwind';
  }

  getPortalType(): string {
    const orgType = this.authStore.user()?.orgType;
    if (orgType === 'SOLVENTEK') return 'Solventek VMS';
    if (orgType === 'VENDOR') return 'Vendor Portal';
    return 'VMS';
  }

  getOrgGradient(): string {
    const orgType = this.authStore.user()?.orgType;
    if (orgType === 'VENDOR') return 'bg-linear-to-br from-emerald-500 to-teal-600';
    return 'bg-linear-to-br from-indigo-500 to-purple-600';
  }

  getOrgTextGradient(): string {
    const orgType = this.authStore.user()?.orgType;
    if (orgType === 'VENDOR') return 'bg-linear-to-r from-emerald-600 to-teal-600';
    return 'bg-linear-to-r from-indigo-600 to-purple-600';
  }

  getOrgFooterBg(): string {
    const orgType = this.authStore.user()?.orgType;
    if (orgType === 'VENDOR') return 'bg-linear-to-r from-emerald-50 to-teal-50';
    return 'bg-linear-to-r from-indigo-50 to-purple-50';
  }

  getRoleBadgeClass(): string {
    const role = this.authStore.userRole();
    if (role === 'SUPER_ADMIN') return 'badge-danger';
    if (role === 'HR_ADMIN') return 'badge-warning';
    if (role === 'ADMIN') return 'badge-primary';
    if (role === 'TA') return 'badge-info';
    if (role === 'VENDOR') return 'badge-success';
    return 'badge-primary';
  }

  formatRole(role: string | undefined | null): string {
    if (!role) return '';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  onMenuClick() {
    this.menuItemClick.emit();
  }
}
